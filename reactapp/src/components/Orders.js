import React from "react";

export function Orders({orders}) {

    const orderTable = orders.map((element) => (
        <tr key={element[0].toString()}>
          <td>{element[0].toString()}</td>
          <td>{element[1].toString()}</td>
          <td>{element[2].toString()}</td>
          <td>{element[3].toString()}</td>
          <td>{element[4].toString()}</td>
          <td>{element[5].toString()}</td>
          <td>{element[6].toString()}</td>
        </tr>
    ));

    return (
        <div className="box">
            <h2>Lista Ordini:</h2>
          <table className="orderTable">
            <thead>
              <tr>
                <th>ID transazione</th>
                <th>Address compratore</th>
                <th>Valore</th>
                <th>Confermata</th>
                <th>Cancellata</th>
                <th>Reso richiesto</th>
                <th>Reso confermato</th>
              </tr>
            </thead>
            <tbody>
              {orderTable}
            </tbody>
          </table>
        </div>
    );
}