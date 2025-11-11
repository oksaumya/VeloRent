# 🚗 VeloRent — A Comprehensive Car Rental Management System

---

## 🧩 1. Project Title  
**A Comprehensive Car Rental Management System**

---

## 💡 2. Problem Statement

The traditional car rental process is often fragmented, leading to complex booking procedures, uncertainty about real-time vehicle availability, and significant manual overhead for businesses.  

**VeloRent** addresses these challenges by providing a centralized, automated platform that streamlines the entire car rental lifecycle — from browsing available vehicles to secure payment processing and booking management — ensuring a **seamless and trustworthy experience** for both customers and administrators.

---

## 🏗️ 3. System Architecture

VeloRent is built on a **modern three-tier architecture**, ensuring clear separation of concerns between the **user interface**, **business logic**, and **data storage**.



### **Architecture Layers**

- **Frontend:**  
  A dynamic single-page application built with **React.js**, using **React Router** for navigation and **Redux Toolkit** for state management.

- **Backend:**  
  A robust **RESTful API** powered by **Node.js** and **Express.js**, handling all business logic, data processing, and third-party integrations.

- **Database:**  
  A flexible **NoSQL database** using **MongoDB** with **Mongoose ODM** for schema modeling and validation.

- **Authentication:**  
  Secure, stateless authentication managed using **JSON Web Tokens (JWT)** for login, signup, and route protection.

### **Hosting**
| Layer | Platform |
|--------|-----------|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |
| File Storage | Cloudinary |

---

## ⚙️ 4. Key Features

| **Category** | **Features** |
|---------------|--------------|
| **Authentication & Authorization** | User registration with email verification, secure JWT-based login/logout, password reset, protected routes, and persistent sessions. |
| **CRUD Operations (Car Management)** | Browse all cars with pagination, search by name/fuel/seats/price range, alphabetical sorting. Admins can add, update, and delete car listings. |
| **Frontend Routing** | Pages for Home, Login, Register, Email Verification, Dashboard, User Profile, Booking Management, New Booking Form, and Payment Confirmation. |
| **Booking System** | Create new bookings with date/time selection, real-time availability checks, booking validation, and cancellation options. |
| **Payment Processing** | Full **Stripe** integration for secure checkout, dynamic cost calculation, payment status tracking (pending, completed, failed), and retry mechanism. |
| **User Profile Management** | View and edit profile (name, phone, address), upload profile picture, and access personalized dashboard with booking history. |
| **Hosting & Deployment** | Frontend deployed via CDN on **Vercel**; Backend API deployed on **Render** for scalability and reliability. |

---

## 🧠 5. Tech Stack

| **Layer** | **Technologies** |
|------------|------------------|
| **Frontend** | React.js, React Router, Redux Toolkit, Axios, SASS, React Bootstrap |
| **Backend** | Node.js, Express.js, Mongoose |
| **Database** | MongoDB |
| **Authentication** | JSON Web Tokens (JWT), bcryptjs |
| **Payment** | Stripe |
| **Email Service** | Nodemailer |
| **Hosting** | Vercel (Frontend), Render (Backend), MongoDB Atlas (Database) |

---

## 🔌 6. API Overview

| # | **Endpoint** | **Method** | **Description** | **Access** | **Category** |
|---|---------------|-------------|------------------|-------------|---------------|
| 1 | `/api` | GET | Health check - verify server status | Public | System |
| 2 | `/api/auth/register` | POST | Register new user with name and email | Public | Auth |
| 3 | `/api/auth/verifyEmail` | PATCH | Verify email with token and set password | Public | Auth |
| 4 | `/api/auth/login` | POST | Authenticate user and return tokens | Public | Auth |
| 5 | `/api/auth/forgotPassword` | POST | Send password reset link to email | Public | Auth |
| 6 | `/api/auth/resetPassword` | PATCH | Reset password using reset token | Public | Auth |
| 7 | `/api/auth/logout` | POST | Invalidate refresh token and logout | Authenticated | Auth |
| 8 | `/api/cars` | GET | Get all available cars with search/filter | Authenticated | Cars |
| 9 | `/api/cars/newBooking` | POST | Create booking and Stripe checkout session | Authenticated | Booking |
| 10 | `/api/cars/confirmBooking` | POST | Confirm booking after Stripe payment | Authenticated | Booking |
| 11 | `/api/cars/:id` | PUT | Retry failed/pending booking payment | Authenticated | Booking |
| 12 | `/api/cars/:id` | DELETE | Cancel booking before start time | Authenticated | Booking |
| 13 | `/api/user` | GET | Get authenticated user details with bookings | Authenticated | User |
| 14 | `/api/user/update` | POST | Update user profile and image | Authenticated | User |

---

## 🚀 Summary

**VeloRent** simplifies car rentals with automation, real-time vehicle availability, secure payments, and user-friendly interfaces — ensuring **efficiency**, **scalability**, and **trust** for both customers and administrators.


