import dayjs from "dayjs";
import Stripe from "stripe";
import { ENV } from "../config/index.js";
import { BookingModel, CarModel, UserModel } from "../models/index.js";

const getAllCars = async (req, res) => {
    console.log("Get all cars requested!");
    console.log("Query params:", req.query);
    let { searchText, fuel, numSeats, minPrice, maxPrice, page = 1, limit = 12, sortBy = "name", sortOrder = "asc" } = req.query;
    const matchConditions = {};

    if (searchText) matchConditions.name = { $regex: searchText, $options: "i" };
    if (fuel) matchConditions.fuel = fuel;
    if (numSeats) matchConditions.seats = parseInt(numSeats);
    if (minPrice || maxPrice) {
        matchConditions.rent = {};
        if (minPrice) matchConditions.rent.$gte = parseInt(minPrice);
        if (maxPrice) matchConditions.rent.$lte = parseInt(maxPrice);
    }
    
    // Parse pagination and sorting parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        console.error("Invalid pagination params:", { pageNum, limitNum });
        return res.status(400).send({ 
            message: "Invalid pagination parameters",
            data: [],
            pagination: null
        });
    }
    
    const skip = (pageNum - 1) * limitNum;
    
    // Determine sort field and order
    const sortField = sortBy === "name" || sortBy === "rent" || sortBy === "random" ? sortBy : "name";
    const sortDirection = sortOrder === "desc" ? -1 : 1;
    
    console.log("Sort settings:", { sortField, sortDirection, pageNum, limitNum });
    
    // Get total count for pagination
    const totalCount = await CarModel.countDocuments(matchConditions);
    const totalPages = Math.ceil(totalCount / limitNum);
    
    // If requested page exceeds total pages, return empty with pagination info
    if (pageNum > totalPages && totalPages > 0) {
        console.log(`Page ${pageNum} exceeds total pages ${totalPages}`);
        return res.status(200).send({ 
            data: [],
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNextPage: false,
                hasPrevPage: pageNum > 1
            }
        });
    }
    
    console.log("Pagination:", { totalCount, totalPages, currentPage: pageNum });
    
    // Build sort object
    let sortObject = {};
    if (sortField === "random") {
        // For random sorting, we don't use traditional sort
        sortObject = null;
    } else if (sortField === "name") {
        // For name sorting, we need to handle case-insensitivity
        // We'll add a temporary lowercase field for sorting
        sortObject = { nameLower: sortDirection };
    } else {
        // For numeric fields like rent
        sortObject = { [sortField]: sortDirection };
    }
    
    console.log("Sort object:", sortObject);
    
    // Sort BEFORE projection to ensure fields exist
    const pipeline = [
        { $match: matchConditions }
    ];
    
    // Add lowercase name field if sorting by name for case-insensitive sort
    if (sortField === "name") {
        pipeline.push({
            $addFields: {
                nameLower: { $toLower: "$name" }
            }
        });
    }
    
    // Add random field if sorting randomly
    if (sortField === "random") {
        pipeline.push({
            $sample: { size: totalCount > 0 ? Math.min(totalCount, 1000) : 1000 }
        });
    } else {
        // Add normal sorting
        pipeline.push({ $sort: sortObject });
    }
    
    pipeline.push(
        { $skip: skip },
        { $limit: limitNum },
        {
            $lookup: {
                from: "bookings",
                localField: "_id",
                foreignField: "carId",
                as: "bookingDetails",
            },
        },
        {
            $project: {
                id: { $toString: "$_id" },
                name: 1,
                imgSrc: "$image",
                seats: 1,
                rent: 1,
                fuel: 1,
                bookingDetails: {
                    $map: {
                        input: "$bookingDetails",
                        as: "booking",
                        in: {
                            from: "$$booking.from",
                            to: "$$booking.to",
                        },
                    },
                },
                _id: 0,
            },
        }
    );
    
    const cars = await CarModel.aggregate(pipeline);
    console.log(`Returning ${cars.length} cars out of ${totalCount} total`);
    
    // Log first few car names to verify sorting
    if (cars.length > 0) {
        console.log("First 5 car names:", cars.slice(0, 5).map(c => c.name));
        console.log("First 5 car rents:", cars.slice(0, 5).map(c => c.rent));
    }
    
    res.status(200).send({ 
        data: cars,
        pagination: {
            currentPage: pageNum,
            totalPages,
            totalCount,
            limit: limitNum,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
        }
    });
};

const newBooking = async (req, res) => {
    console.log("New Booking", req.body);
    try {
        const { carId, bookingStartTime, bookingEndTime, bookingHours, id } = req.body;
        const [carDetails, userDetails] = await Promise.all([
            CarModel.findById(carId, { name: 1, rent: 1 }),
            UserModel.findById(id, { email: 1 }),
        ]);
        const startTime = dayjs(bookingStartTime);
        const endTime = dayjs(bookingEndTime);

        const stripe = new Stripe(ENV.STRIPE_KEY);
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: carDetails.name,
                            description: `Booking from ${bookingStartTime} to ${bookingEndTime}`,
                        },
                        unit_amount: carDetails.rent * 100,
                    },
                    quantity: bookingHours,
                },
            ],
            customer_email: userDetails.email,
            mode: "payment",
            success_url: `${ENV.CLIENT_URL}${ENV.PAYMENT_CONF_URL}?success=true`,
            cancel_url: `${ENV.CLIENT_URL}${ENV.PAYMENT_CONF_URL}?success=false`,
        });
        await BookingModel.create({ carId, userId: id, from: startTime, to: endTime, paymentId: session.id });
        res.cookie("SID", session.id, { origin: ENV.CLIENT_URL, sameSite: "none", httpOnly: true, secure: true, maxAge: 15 * 60 * 1000 });
        res.status(200).send({ url: session.url, next: "redirect" });
    } catch (err) {
        console.error(err);
        res.status(200).send({ message: "Unable to book at the moment!", next: "" });
    }
};

const retryBooking = async (req, res) => {
    console.log("Retry Booking");
    const { id } = req.params;
    const bookingDetails = await BookingModel.findById(id);
    if (!bookingDetails) return res.status(200).send({ message: "Invalid booking", next: "home" });
    const startTime = dayjs(bookingDetails.from);
    const endTime = dayjs(bookingDetails.to);
    const bookingHours = endTime.diff(startTime, "hours");
    const [carDetails, userDetails] = await Promise.all([
        CarModel.findById(bookingDetails.carId, { name: 1, rent: 1 }),
        UserModel.findById(bookingDetails.userId, { email: 1 }),
    ]);

    const stripe = new Stripe(ENV.STRIPE_KEY);
    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price_data: {
                    currency: "inr",
                    product_data: {
                        name: carDetails.name,
                        description: `Booking from ${startTime} to ${endTime}`,
                    },
                    unit_amount: carDetails.rent * 100,
                },
                quantity: bookingHours,
            },
        ],
        customer_email: userDetails.email,
        mode: "payment",
        success_url: `${ENV.CLIENT_URL}${ENV.PAYMENT_CONF_URL}?success=true`,
        cancel_url: `${ENV.CLIENT_URL}${ENV.PAYMENT_CONF_URL}?success=false`,
    });
    await BookingModel.findByIdAndUpdate(id, { paymentId: session.id, status: "pending" });
    res.cookie("SID", session.id, { origin: ENV.CLIENT_URL, sameSite: "none", httpOnly: true, secure: true, maxAge: 15 * 60 * 1000 });
    res.status(200).send({ url: session.url, next: "redirect" });
};

const confirmBooking = async (req, res) => {
    console.log("Confirming booking");
    const { success, id } = req.body;
    const sessionId = req.cookies.SID;
    if (!sessionId) return res.status(200).send({ message: "Invalid booking", next: "home" });
    const bookingDetails = await BookingModel.findOne({ userId: id, paymentId: sessionId });
    if (!bookingDetails) return res.status(200).send({ message: "Invalid booking", next: "home" });
    const stripe = new Stripe(ENV.STRIPE_KEY);
    const session = await stripe.checkout.sessions.retrieve(req.cookies.SID);
    const { payment_status, status } = session;
    console.log(payment_status, status);
    let bookingStatus = success === "true" && payment_status === "paid" && status === "complete" ? "completed" : "failed";
    await BookingModel.findByIdAndUpdate(bookingDetails._id, { $set: { status: bookingStatus } });
    console.log("S", payment_status, status);
    res.status(200).send({ message: "Booking successful!", next: "home" });
};

const cancelBooking = async (req, res) => {
    console.log("Cancel booking");
    const { id } = req.params;
    const bookingDetails = await BookingModel.findById(id);
    if (!bookingDetails) return res.status(200).send({ message: "Invalid booking", next: "home" });
    const currentTime = dayjs();
    const bookingStartTime = dayjs(bookingDetails.from);
    if (bookingStartTime.isBefore(currentTime)) return res.status(200).send({ message: "Can't cancel this booking", next: "home" });
    await BookingModel.findByIdAndUpdate(id, { status: "canceled" });
    res.status(200).send({ message: "Booking canceled successfully!", next: "home" });
};

const deleteBooking = async (req, res) => {
    console.log("Delete booking");
    const { id } = req.params;
    const bookingDetails = await BookingModel.findById(id);
    if (!bookingDetails) return res.status(200).send({ message: "Invalid booking", next: "home" });
    
    // Delete the booking permanently
    await BookingModel.findByIdAndDelete(id);
    res.status(200).send({ message: "Booking deleted successfully!", next: "home" });
};

export default { getAllCars, newBooking, retryBooking, confirmBooking, cancelBooking, deleteBooking };
