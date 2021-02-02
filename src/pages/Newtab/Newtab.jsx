import React from 'react';
import './Newtab.css';
import './Newtab.scss';
import Popup from 'react-popup';
import 'reactjs-popup/dist/index.css';
import * as thisOne from './AuthorPopup.jsx';
const TestPopup = () => {
  console.log("click");
  return <Popup trigger={<button> Click here </button>} on="right-click" position="top right"> <div>Author Information</div>
  </Popup>
}

const Newtab = () => {
  console.log(thisOne.square(2));
  return (<thisOne.theory name="cooper" />);
};

export default Newtab;
