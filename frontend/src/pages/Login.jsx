import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import toast from "react-hot-toast";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
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

    try {
      const data = await loginUser(formData);

      localStorage.setItem(
        "token",
        data.access_token
      );

      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
        "Login Failed"
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#1e293b] border border-slate-700 rounded-2xl p-8 shadow-2xl">

        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome Back
        </h1>

        <p className="text-slate-400 mb-8">
          Login to continue learning
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-purple-500"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-purple-500"
          />

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 transition p-3 rounded-lg text-white font-semibold cursor-pointer"
          >
            Login
          </button>

          <div className="text-center pt-2">
            <p className="text-slate-400">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                Register
              </Link>
            </p>
          </div>
        </form>

      </div>
    </div>
  );
}

export default Login;