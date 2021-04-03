import React, { useEffect, useState } from 'react';
import {FaRegSmile} from 'react-icons/fa';
import {FaRegFrown} from 'react-icons/fa';
import {FaExclamation} from 'react-icons/fa';
import {FaComment} from 'react-icons/fa';
import {FaStickyNote} from 'react-icons/fa';

const ToolTip = () => {
    return (        
        <>
        <div className = "btn-group btn-group-sm"> 
         <button type="button" className="btn btn-success" id='smile' title="Green Highlight" onClick={()=>console.log("smile")}> <FaRegSmile id = "smile"/></button>
          <button type="button" className="btn btn-danger" id='frown' title="Red Highlight" onClick={()=>console.log("frown")}> <FaRegFrown id ="frown"/></button>
          <button type="button" className="btn btn-warning" id='highlight' title="Yellow Highlight" onClick={()=>console.log("highlight")}> <FaExclamation id ="highlight"/></button>
          <button type="button" className="btn btn-primary" id='comment' title="Create comment" onClick={()=>console.log("comment")}> <FaComment id = "comment"/></button>
          <button type="button" className="btn btn-dark" id='note' title="Personal Note" onClick={()=>console.log("note")}> <FaStickyNote id ="note"/></button>
        </div>
</>
    );
    
}

 export default ToolTip