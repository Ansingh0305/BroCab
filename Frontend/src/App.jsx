import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./Components/Dashboard/Dashboard";
import LoginPage from "./Components/Pages/LoginPage";
import ForgotPasswordPage from "./Components/Pages/ForgotPasswordPage";
import SignUpPage from "./Components/Pages/SignUpPage";
import Available_rides from "./Components/Available_rides/Available_rides";
import Contact_us from "./Components/Contact_us/Contact_us";
import PostRidePage from "./Components/PostRide/PostRide";
import Requested from "./Components/Requested/Requested";
import MyBookedRides from "./Components/MyBookedRides/MyBookedRides";
import Privileges from "./Components/Privileges/Privileges";

import MyRides from "./Components/Myrides/MyRides"; 

import Notifications from "./Components/Notifications/Notifications";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/available-rides" element={<Available_rides />} />
        <Route path="/contact-us" element={<Contact_us />} />
        <Route path="/privileges" element={<Privileges />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/post-ride" element={<PostRidePage />} />
        <Route path="/requested" element={<Requested/>}/>
        <Route path="my-booked-rides" element={<MyBookedRides />} />
        <Route path="/privileges" element={<Privileges/>}/>
        <Route path="/my-rides" element={<MyRides/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
