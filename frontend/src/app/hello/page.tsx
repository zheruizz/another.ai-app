"use client";
import React, { useEffect, useState } from "react";

export default function HelloPage() {
  const [backendMessage, setBackendMessage] = useState<string>("");

  useEffect(() => {
    fetch("https://150xqu40fg.execute-api.us-east-1.amazonaws.com/prod/hello")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => setBackendMessage(data.message))
      .catch((err) => {
        setBackendMessage("Error calling backend!");
        console.error("Backend fetch error:", err);
      });
  }, []);

  return (
    <main>
      <h1>Hello from another.ai!</h1>
      <p>Backend says: {backendMessage}</p>
    </main>
  );
}