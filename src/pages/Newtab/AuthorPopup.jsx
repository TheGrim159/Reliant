import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import 'bootstrap/dist/css/bootstrap.min.css';

export function theory(props) {

    return (
        <div>
          <h1 data-tip={props.name}>https://www.freecodecamp.org/news/self-positioning-react-components-2/ </h1>
          <ModalTest name="COoper Meitz" desc='He is the author of the novel "Hunger Games"'/>
        </div>
        );
}

export function square(x) {
    return x * x;
}

function ModalTest(props) {
    console.log("here");
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    return (
        <>
          <Button variant="primary" onClick={handleShow}>
            Author Information
          </Button>
    
          <Modal show={show} onHide={handleClose} size='sm'>
            <Modal.Header closeButton>
              <Modal.Title>{props.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {props.desc}
              <img src="icon.png" alt="Reliant Logo"></img>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleClose}>
                Cool i love this info
              </Button>
            </Modal.Footer>
          </Modal>
        </>
    );
}