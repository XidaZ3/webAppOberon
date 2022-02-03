import React from "react";

export function Orders({orders}) {

    console.log("Orders list:", orders);

    return (
        <div className="container">
            <button onClick={orders} className="cta-button create-button">Orders list</button>
        </div>
    );
}