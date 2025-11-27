/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import { Button, ButtonGroup, FloatingLabel, Form, Image, Navbar, Container, Card, Badge, Pagination } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { UserPlaceholder } from "../assets";
import { Bookings, NewBooking, UserProfile } from "../components";
import { useApiPrivate, useSessionStorage } from "../hooks";
import "./Home.sass";
import PulseLoader from "react-spinners/PulseLoader";

export default function Home() {
    const [cars, setCars] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [user, setUser] = useState({});
    const [searchText, setSearchText] = useState("");
    const [fuelType, setFuelType] = useState("");
    const [seats, setSeats] = useState("");
    const [priceRange, setPriceRange] = useState([1000, 10000]);
    const [selectedCar, setSelectedCar] = useState();
    const [params, setParams] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");
    const [showUserModal, setShowUserModal] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showNewBookingModal, setShowNewBookingModel] = useState(false);
    const { getItem, removeItem } = useSessionStorage();
    const { getCars, getUserInfo } = useApiPrivate();
    const itemCrRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const authKey = getItem("LOGGED_IN");
        if (!authKey) navigate("/authenticate", { replace: true });
        // Initialize with default pagination and sorting
        setParams({ page: 1, limit: 12, sortBy: "name", sortOrder: "asc" });
        fetchUser();
    }, []);

    useEffect(() => {
        console.log("Params changed:", params);
        if (Object.keys(params).length > 0) {
            fetchCars();
        }
    }, [params]);

    const fetchUser = async () => {
        const userInfo = await getUserInfo();
        setUser(userInfo);
    };

    const fetchCars = async () => {
        console.log("Fetching cars with params:", params);
        const result = await getCars(params);
        console.log("API Response:", result);
        console.log("Cars data:", result?.data);
        
        const carsData = result?.data && result.data.length > 0 ? result.data : [];
        
        // Log car names to verify sorting
        if (carsData.length > 0) {
            console.log("Car names in order:", carsData.map(c => c.name));
            console.log("Car rents in order:", carsData.map(c => c.rent));
        }
        
        setCars(carsData);
        setPagination(result?.pagination || null);
        console.log("Pagination:", result?.pagination);
    };

    const handlePriceChange = (e) => {
        const { name, value } = e.target;
        setPriceRange((prevRange) => {
            const newRange = [...prevRange];
            if (name === "minPrice") newRange[0] = Number(value);
            else if (name === "maxPrice") newRange[1] = Number(value);
            return newRange;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const localParams = {
            page: 1,
            limit: 12,
            sortBy,
            sortOrder
        };

        if (searchText !== "") localParams.searchText = searchText;
        if (fuelType !== "") localParams.fuel = fuelType;
        if (seats) localParams.numSeats = seats;
        if (priceRange[0] !== 1000 || priceRange[1] !== 100000) {
            localParams.minPrice = priceRange[0];
            localParams.maxPrice = priceRange[1];
        }
        setCurrentPage(1);
        setParams(localParams);
    };

    const handleReset = () => {
        setSearchText("");
        setFuelType("");
        setSeats("");
        setPriceRange([1000, 10000]);
        setSortBy("name");
        setSortOrder("asc");
        setCurrentPage(1);
        setParams({ page: 1, limit: 12, sortBy: "name", sortOrder: "asc" });
    };
    
    const handlePageChange = (page) => {
        // Validate page number
        if (!page || page < 1) {
            console.error("Invalid page number:", page);
            return;
        }
        
        // Check against totalPages if available
        if (pagination && page > pagination.totalPages) {
            console.error("Page number exceeds total pages:", page, ">", pagination.totalPages);
            return;
        }
        
        console.log("Changing to page:", page);
        setCurrentPage(page);
        const newParams = { ...params, page, limit: 12, sortBy, sortOrder };
        setParams(newParams);
        // Scroll to top of car listings
        if (itemCrRef.current) {
            itemCrRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };
    
    const handleSortChange = (newSortBy) => {
        console.log("Sort button clicked:", newSortBy);
        console.log("Current sort:", { sortBy, sortOrder });
        
        let newSortOrder = sortOrder;
        
        // Random doesn't need order toggling
        if (newSortBy === "random") {
            newSortOrder = "asc"; // doesn't matter for random
        } else if (newSortBy === sortBy) {
            // If clicking the same sort field, toggle the order
            newSortOrder = sortOrder === "asc" ? "desc" : "asc";
        } else {
            // If switching to a new field, default to ascending
            newSortOrder = "asc";
        }
        
        console.log("New sort:", { sortBy: newSortBy, sortOrder: newSortOrder });
        
        setSortBy(newSortBy);
        setSortOrder(newSortOrder);
        setCurrentPage(1);
        
        // Create new params preserving all filters
        const newParams = { ...params, sortBy: newSortBy, sortOrder: newSortOrder, page: 1, limit: 12 };
        console.log("Setting new params:", newParams);
        setParams(newParams);
    };

    const logout = () => {
        removeItem("LOGGED_IN");
        navigate("/authenticate", { replace: true });
    };

    return (
        <>
            <section className="sheet home">
                <Navbar className="nav" expand="lg" variant="light">
                    <Container>
                        <Navbar.Brand href="/">
                            <div className="logo-container">

                                <span className="brand-text">VeloRent</span>
                            </div>
                        </Navbar.Brand>
                        <Navbar.Toggle aria-controls="basic-navbar-nav" />
                        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
                            <ButtonGroup>
                                <Button
                                    variant="outline-primary"
                                    onClick={() => setShowUserModal(true)}
                                    className="user-btn"
                                >
                                    <span className="user-avatar">
                                        {user.imgSrc ? <Image roundedCircle src={user.imgSrc} alt={user.name} /> : <UserPlaceholder />}
                                    </span>
                                    {user.name}
                                </Button>
                                <Button variant="outline-primary" onClick={() => setShowBookingModal(true)}>
                                    My Bookings
                                </Button>
                                <Button variant="outline-danger" onClick={logout}>
                                    Logout
                                </Button>
                            </ButtonGroup>
                        </Navbar.Collapse>
                    </Container>
                </Navbar>
                
                <div className="search-section">
                    <Card className="filter-card">
                        <Card.Header>
                            <h4>Find Your Perfect Ride</h4>
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                <FloatingLabel controlId="searchText" label="Search" className="mb-3">
                                    <Form.Control
                                        type="text"
                                        placeholder="Search by car name or model"
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                    />
                                </FloatingLabel>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>Fuel Type</Form.Label>
                                    <div className="d-flex gap-3">
                                        <Form.Check 
                                            type="radio" 
                                            id="petrol"
                                            label="Petrol" 
                                            name="fuelType"
                                            value="petrol" 
                                            onChange={(e) => setFuelType(e.target.value)} 
                                        />
                                        <Form.Check 
                                            type="radio" 
                                            id="diesel"
                                            label="Diesel" 
                                            name="fuelType"
                                            value="diesel" 
                                            onChange={(e) => setFuelType(e.target.value)} 
                                        />
                                    </div>
                                </Form.Group>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>Number of seats</Form.Label>
                                    <Form.Select value={seats} onChange={(e) => setSeats(e.target.value)}>
                                        <option value="">Select seats</option>
                                        {[2, 4, 5, 6, 7, 8].map((seat) => (
                                            <option key={`seats-${seat}`} value={seat}>
                                                {seat}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>Price Range (₹ per hour)</Form.Label>
                                    <div className="d-flex gap-2 align-items-center mb-2">
                                        <Form.Control
                                            type="number"
                                            placeholder="Min Value"
                                            value={priceRange[0]}
                                            name="minPrice"
                                            min="1000"
                                            max="100000"
                                            step="1000"
                                            onChange={handlePriceChange}
                                        />
                                        <span>to</span>
                                        <Form.Control
                                            type="number"
                                            placeholder="Max Value"
                                            value={priceRange[1]}
                                            name="maxPrice"
                                            min="1000"
                                            max="100000"
                                            step="1000"
                                            onChange={handlePriceChange}
                                        />
                                    </div>
                                </Form.Group>
                                
                                <div className="d-grid gap-2">
                                    <Button variant="primary" type="submit">
                                        Search
                                    </Button>
                                    <Button variant="outline-secondary" type="reset" onClick={handleReset}>
                                        Reset
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </div>
                
                <div className="car-listings" id="itemsCr" ref={itemCrRef}>
                    <div className="listings-header">
                        <h2>Available Vehicles</h2>
                        <div className="sort-controls">
                            <Form.Label className="me-2">Sort by:</Form.Label>
                            <ButtonGroup>
                                <Button
                                    variant={sortBy === "name" ? "primary" : "outline-primary"}
                                    size="sm"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        console.log("Name button clicked!");
                                        handleSortChange("name");
                                    }}
                                >
                                    Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                                </Button>
                                <Button
                                    variant={sortBy === "rent" ? "primary" : "outline-primary"}
                                    size="sm"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        console.log("Price button clicked!");
                                        handleSortChange("rent");
                                    }}
                                >
                                    Price {sortBy === "rent" && (sortOrder === "asc" ? "↑" : "↓")}
                                </Button>
                                <Button
                                    variant={sortBy === "random" ? "primary" : "outline-primary"}
                                    size="sm"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        console.log("Random button clicked!");
                                        handleSortChange("random");
                                    }}
                                >
                                    Random 🎲
                                </Button>
                            </ButtonGroup>
                        </div>
                    </div>
                    
                    <div className="car-grid">
                        {cars.length > 0 ? (
                            cars.map((car, i) => (
                                <Card key={car.id || car.name + i} className="car-card">
                                    <div className="car-img-container">
                                        <Card.Img variant="top" src={car.imgSrc} alt={car.name} />
                                    </div>
                                    <Card.Body>
                                        <Card.Title>{car.name}</Card.Title>
                                        <div className="car-features">
                                            <Badge bg="info" className="feature-badge">
                                                {car.fuel.replace(/\b\w/g, (char) => char.toUpperCase())}
                                            </Badge>
                                            <Badge bg="info" className="feature-badge">
                                                {car.seats} seats
                                            </Badge>
                                        </div>
                                        <div className="price-section">
                                            <span className="price">₹{car.rent}/hour</span>
                                        </div>
                                        <Button
                                            variant="accent"
                                            className="book-now-btn"
                                            onClick={() => {
                                                setSelectedCar(car);
                                                setShowNewBookingModel(true);
                                            }}
                                        >
                                            Book now
                                        </Button>
                                    </Card.Body>
                                </Card>
                            ))
                        ) : (
                            <div className="loader-container">
                                <PulseLoader color="#ff5e3a" />
                            </div>
                        )}
                    </div>
                    
                    {pagination && (
                        <div className="pagination-wrapper">
                            {pagination.totalPages > 1 && (
                                <Pagination className="justify-content-center mt-4">
                                    <Pagination.First 
                                        onClick={() => handlePageChange(1)} 
                                        disabled={currentPage === 1}
                                    />
                                    <Pagination.Prev 
                                        onClick={() => handlePageChange(currentPage - 1)} 
                                        disabled={!pagination.hasPrevPage}
                                    />
                                    
                                    {pagination.totalPages <= 10 ? [...Array(Math.min(pagination.totalPages, 10))].map((_, index) => {
                                        const page = index + 1;
                                        // Show first page, last page, current page, and pages around current
                                        if (
                                            page === 1 ||
                                            page === pagination.totalPages ||
                                            (page >= currentPage - 1 && page <= currentPage + 1)
                                        ) {
                                            return (
                                                <Pagination.Item
                                                    key={page}
                                                    active={page === currentPage}
                                                    onClick={() => handlePageChange(page)}
                                                    disabled={page > pagination.totalPages}
                                                >
                                                    {page}
                                                </Pagination.Item>
                                            );
                                        } else if (
                                            page === currentPage - 2 ||
                                            page === currentPage + 2
                                        ) {
                                            return <Pagination.Ellipsis key={page} disabled />;
                                        }
                                        return null;
                                    }) : (
                                        <>
                                            <Pagination.Item active={currentPage === 1} onClick={() => handlePageChange(1)}>1</Pagination.Item>
                                            {currentPage > 3 && <Pagination.Ellipsis disabled />}
                                            {currentPage > 2 && currentPage <= 10 && (
                                                <Pagination.Item onClick={() => handlePageChange(currentPage - 1)}>{currentPage - 1}</Pagination.Item>
                                            )}
                                            {currentPage !== 1 && currentPage !== 10 && currentPage <= 10 && (
                                                <Pagination.Item active>{currentPage}</Pagination.Item>
                                            )}
                                            {currentPage < 9 && currentPage < 10 && (
                                                <Pagination.Item onClick={() => handlePageChange(currentPage + 1)}>{currentPage + 1}</Pagination.Item>
                                            )}
                                            {currentPage < 8 && <Pagination.Ellipsis disabled />}
                                            <Pagination.Item 
                                                active={currentPage === 10} 
                                                onClick={() => handlePageChange(10)}
                                            >
                                                10
                                            </Pagination.Item>
                                        </>
                                    )}
                                    
                                    <Pagination.Next 
                                        onClick={() => handlePageChange(currentPage + 1)} 
                                        disabled={!pagination.hasNextPage || currentPage >= 10}
                                    />
                                    <Pagination.Last 
                                        onClick={() => handlePageChange(Math.min(pagination.totalPages, 10))} 
                                        disabled={currentPage >= 10}
                                    />
                                </Pagination>
                            )}
                            <div className="pagination-info text-center mt-2">
                                <small className="text-muted">
                                    {cars.length > 0 ? (
                                        <>
                                            Showing {cars.length} of {pagination.totalCount} vehicles
                                            {pagination.totalPages > 1 && ` (Page ${Math.min(currentPage, 10)} of ${Math.min(pagination.totalPages, 10)})`}
                                        </>
                                    ) : (
                                        'No vehicles found'
                                    )}
                                </small>
                            </div>
                        </div>
                    )}
                </div>
                
                <footer className="footer">
                    <Container>
                        <p>&copy; 2025 VeloRent - Premium Car Rental Service</p>
                    </Container>
                </footer>
            </section>
            
            <UserProfile show={showUserModal} handleClose={() => setShowUserModal(false)} user={user} />
            <Bookings show={showBookingModal} handleClose={() => setShowBookingModal(false)} user={user} fetchUser={fetchUser} />
            <NewBooking show={showNewBookingModal} handleClose={() => setShowNewBookingModel(false)} car={selectedCar} />
        </>
    );
}
