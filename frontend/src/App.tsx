import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateEvent from "./pages/CreateEvent";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import EventRegistration from "./pages/EventRegistration";
import MyRegistrations from "./pages/MyRegistrations";
import EventRegistrations from "./pages/EventRegistrations";
import MyEvents from "./pages/MyEvents";
import AdminDashboard from "./pages/AdminDashboard";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-event" element={<CreateEvent />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:eventId" element={<EventDetails />} />   
      <Route path="/events/:eventId/register" element={<EventRegistration />} /> 
      <Route path="/my-registrations" element={<MyRegistrations />} />
      <Route path="/events/:eventId/registrations" element={<EventRegistrations />} />
      <Route path="/my-events" element={<MyEvents />} />
      <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
      
    </BrowserRouter>
  );
}

export default App;