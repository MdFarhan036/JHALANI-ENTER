import React from "react";

export default function LoadingState({
  message = "Loading...",
  fullPage = false,
}) {
  return (
    <div
      className={`common-loading-state ${
        fullPage ? "common-loading-full-page" : ""
      }`}
    >
      <div className="common-loading-spinner" />

      <div className="common-loading-message">
        {message}
      </div>
    </div>
  );
}