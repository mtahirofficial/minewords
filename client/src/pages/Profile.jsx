import React, { useEffect, useState } from 'react'
import api from "../api";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(user);

  useEffect(() => {
    setProfile(user);
  }, [user]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get("/auth/me");
        setProfile(res.data?.data || user);
      } catch (error) {
        console.error("Failed to load profile", error);
      }
    };

    if (user?.token || localStorage.getItem("accessToken")) {
      loadProfile();
    }
  }, [user]);

  return (
    <main className="container">
      <h2 className="section-title">Profile</h2>
      <div className="about-box">
        <h3>Your Account Details</h3>
        <p className="mb-4">
          You can view or update your profile information here.
        </p>
        <div className="profile-details">
          <div className="profile-info-row">
            <span className="font-semibold">Name:</span> <span>{profile?.name || "Not available"}</span>
          </div>
          <div className="profile-info-row">
            <span className="font-semibold">Email:</span> <span>{profile?.email || "Not available"}</span>
          </div>
        </div>
        <button className="btn btn-primary" type="button">Edit Profile</button>
      </div>
      <div className="about-box">
        <h3>Account Actions</h3>
        <button className="btn btn-primary btn-critical" type="button">Delete Account</button>
      </div>
    </main>
  )
}

export default Profile
