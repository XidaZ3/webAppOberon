import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import { DApp } from './components/DApp';
import { RegisterSeller } from './components/RegisterSeller';

ReactDOM.render(
  // <React.StrictMode>
  //   <DApp />
  // </React.StrictMode>,
  <Router>
    <Routes>
      <Route path="/" element={<DApp />} />
      <Route path="/register-seller" element={<RegisterSeller />} />
      {/* <Route path="/register-seller" render={<RegisterSeller />} /> */}
      {/* <Route path="/register-seller" render={props => (
        <RegisterSeller
          currentAddress={props.match.params.currentAddress}
          balance={props.match.params.balance}
        />
      )}/> */}
    </Routes>
  </Router>,
  document.getElementById('root')
);