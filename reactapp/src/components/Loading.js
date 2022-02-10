import React from "react";

export function Loading() {
    return (
        <div className="box">
            <div className="spinner">
                <span>Loading...</span>
                <div className="half-spinner"></div>
            </div>
        </div>
    );
}