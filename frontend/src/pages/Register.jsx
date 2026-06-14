import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, loginUser } from "../services/authService";
import toast from "react-hot-toast";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await registerUser(formData);
      toast.success("Account created successfully!");
      
      // Auto login user (Option A)
      const loginData = await loginUser({
        email: formData.email,
        password: formData.password
      });

      localStorage.setItem("token", loginData.access_token);
      toast.success("Welcome to AI Learning Copilot!");
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Registration Failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#1e293b] border border-slate-700 rounded-2xl p-8 shadow-2xl">

        <h1 className="text-3xl font-bold text-white mb-2">
          Create Account
        </h1>

        <p className="text-slate-400 mb-8">
          Start your AI Learning Journey
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-purple-500"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-purple-500"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-purple-500"
          />

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 transition p-3 rounded-lg text-white font-semibold cursor-pointer"
          >
            Create Account
          </button>

          <div className="text-center pt-2">
            <p className="text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                Login
              </Link>
            </p>
          </div>
        </form>

      </div>
    </div>
  );
}

export default Register;
