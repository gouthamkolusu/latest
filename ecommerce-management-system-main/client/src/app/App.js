import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

// ⬇️ Import the debug button


export default function AppLayout() {
  return (
    <div
      className="app-root"
      style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}
    >
      <Header />

      <main
        id="main-content"
        role="main"
        style={{
          flex: 1,
          padding: "1rem",
          width: "100%",
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        {/* ⬇️ Add the button temporarily for debugging */}
       

        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
