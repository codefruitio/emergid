"use client";

import { useEffect } from "react";

export default function WhiteBgEffect() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.background;
    const prevBody = body.style.background;
    html.style.background = "white";
    body.style.background = "white";
    return () => {
      html.style.background = prevHtml;
      body.style.background = prevBody;
    };
  }, []);
  return null;
}
