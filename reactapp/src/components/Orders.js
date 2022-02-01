import React from "react";

export function Orders({orders}) {

    console.log(orders);

    return (
        <div className="container">
            <p>Lista Ordini: {orders}</p>
        </div>
    );
}