import React from 'react';
import { render } from 'react-dom';
// import Questionnaire from './modules/Questionnaire';
// import Comment from './modules/Comment-Container';
import { URLS } from '../Background/workingUrls';
import axios from 'axios';
import { calculateScore } from '../../containers/Score/Score';
import ToolComponent from './modules/Tooltip-Component';
import {createQuestionnaire, removeQuestionnaire}  from './Questionnaire'
import {authorName} from './authorName'

console.log('Content script works!');
console.log('Must reload extension for modifications to take effect.');


var ACTIVATED = false;
var LOADED = false;
var paragraphs = null;
var currentURL = null;
var currentHostname = null;
var currentUserInfo = null;

function getLoadedState() {
  return LOADED;
}
function getActivateState() {
  return ACTIVATED;
}

async function getURL() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage('activeURL', (url) => {
      resolve(url);
    });
  });
}

async function getUserInfo() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage('userInfo', (userInfo) => {
      resolve(userInfo);
    });
  });
}

var first = true; //Used to ensure the questionnaire can only be injected once.
var colors = []; // Array holding paragraph colors in the form [original, random]
var even = 0; // 0 --> Original Color, 1 --> Random Color
window.onload = async function () {
  LOADED = true;
  console.log('LOADED');
  currentHostname = new URL(await getURL()).hostname;
  console.log(currentHostname);
  for (const key in URLS) {
    if (currentHostname.includes(URLS[key])) {
      activateReliant();
      break;
    }
  }
};
var timeOpened = new Date().getTime();

async function activateReliant() {
  if (!LOADED) {
    console.log('page not loaded');
    return; // Prevents Reliant from being activated if the site is not done loading.
  }
  ACTIVATED = true;
  console.log('activated reliant', getActivateState());
  currentURL = await getURL();
  currentUserInfo = await getUserInfo();
  currentHostname = new URL(currentURL).hostname;

  axios
    .post('http://localhost:4000/api/user/updateSites', {
      _id: currentUserInfo.id,
      website: {
        _id: currentURL,
        timespent: 5,
      },
    })
    .then(() => {
      console.log('Data has been sent to the server');
    })
    .catch((err) => {
      console.log('Internal server error in updateSites:', err);
    });

  axios
    .post('http://localhost:4000/api/websites/addSite', {
      _id: currentURL,
    })
    .then((response) => {
      console.log(response);
    })
    .catch((err) => {
      console.log('Internal server error in addSite:', err);
    });

  axios.get("http://localhost:4000/api/websites/getUserHighlights", {params: {
    url: currentURL,
    userID: currentUserInfo.id
  }}).then((res) => {
    for(highlightObj in res) {
      console.log("Highlight from DB:", highlightObj.highlightSelection)
      highlightText('#ffc107', highlightObj.highlightSelection);
    }
  }).catch((err) => {
    console.log('Internal server error in getUserHighlights:', err);
  });

  if (first) {
    createQuestionnaire(currentUserInfo.id, currentURL, currentHostname);

    //Highlight everything
    even = (even + 1) % 2;

    let tooltip = document.createElement('span');
    tooltip.className = 'tool_tip';

    document.body.appendChild(tooltip);

    let isToolTipVisible = false;
    let lastSelection = null;
    let lastSelectionObj = null;
    var markerEl = null;

    render(<ToolComponent>aa</ToolComponent>, tooltip);
    tooltip.style.position = 'absolute';
    tooltip.style.visibility = 'hidden';
    tooltip.style.display = 'none';

    const renderToolTip = (mouseX, mouseY, selection) => {
      mouseX = mouseX - 50;
      mouseY = mouseY - 40;
      if (selection.length < 60) {
        mouseX = mouseX - 20;
      }
      tooltip.style.top = mouseY + 'px';
      tooltip.style.left = mouseX + 'px';
      tooltip.style.visibility = 'visible';
      tooltip.style.display = 'block';
      isToolTipVisible = true;
    };

    const closeToolTip = () => {
      tooltip.style.visibility = 'hidden';
      tooltip.style.display = 'none';
      isToolTipVisible = false;
      clearSelection();
    };

    function clearSelection() {
      if (window.getSelection) {window.getSelection().removeAllRanges();}
      else if (document.selection) {document.selection.empty();}
    }

    var startX = 0;
    var endX = 0;
    var startY = 0;
    var endY = 0;

    //Close the tool tip
    document.addEventListener('mousedown', (e) => {
      const parentClassName = e.target.parentNode.getAttribute('class');
      const parentIdName = e.target.parentNode.getAttribute('id');
      console.log('Parent Class:', parentClassName);
      console.log('Parent ID:', parentIdName);
      //Make the tool tip invisible
      if (isToolTipVisible) {
        e.stopPropagation();
        return false;
      } else {
        startX = e.pageX;
        startY = e.pageY;
        closeToolTip();
      }
    });
    // Show the tool tip
    document.addEventListener('mouseup', (e) => {
      console.log(window.getSelection());
      let temp = window.getSelection();
      let selection = temp.toString();
      console.log('Current selection', selection);
      console.log('THIS SELECTION WAS THIS LONG: ', selection.length);
      console.log('Selection baseNode:', temp.baseNode);
      console.log('Selection focusNode:', temp.focusNode);
      console.log(
        'CHECKING SELECTION PARENTS:',
        temp.baseNode.parentNode == temp.focusNode.parentNode
      );
       let comp =
        temp.baseNode == temp.focusNode ||
       temp.baseNode.parentNode == temp.focusNode.parentNode;
      if ((selection == lastSelection && isToolTipVisible)) {
        console.log('I dont want to render at all');
        e.stopPropagation();
        return false;
      } else if (selection.length > 0) {
        console.log("Rendering the tooltip")
        //Render the tooltip
        endX = e.pageX;
        endY = e.pageY;
        console.log('start x is ', startY);
        console.log('end x is ', endY);

        const realStartX = Math.min(startX, endX);
        const realendX = Math.max(startX, endX);

        const realStartY = Math.min(startY, endY);
        const realEndY = Math.max(startY, endY);
        lastSelection = selection;
        lastSelectionObj = window.getSelection();

        renderToolTip(
          (realendX - realStartX) / 2 + realStartX,
          realStartY - (realEndY - realStartY) / 2,
          selection
        );
      } else {
        closeToolTip();
      }
    });

    //Highlight options
    document.addEventListener('click', (e) => {
      const parser = new DOMParser();
      const parentIdName = e.target.parentNode.getAttribute('id');
      const currentID = e.target.getAttribute('id');
      const range = lastSelectionObj.getRangeAt(0)
      console.log("RANGE:", range)
      console.log("Range to string:", range.toString())
      console.log("type of widow.getSelection():", typeof(window.getSelection()))
      const payload = {
        url: currentURL,
        userID: currentUserInfo.id,
        highlightSelection: range
      }
      console.log("type of payload.hightlightSelection:", typeof(payload.highlightSelection))
      console.log("Payload", payload)
      console.log("Payload type:", typeof(payload))
      console.log("SelectionObj.toString()", payload.highlightSelection.toString())
      if (parentIdName == 'highlight' || currentID == 'highlight') {
        axios.post('http://localhost:4000/api/websites/addHighlights', payload).then((res) => {
          console.log(res);
          highlightText('#ffc107', range);
        })
        closeToolTip();
      } else if (parentIdName == 'smile' || currentID == 'smile') {

        highlightText('#28a745', range);
        closeToolTip();
      } else if (parentIdName == 'frown' || currentID == 'frown') {
        highlightText('#dc3545', range);
        closeToolTip();
      } else if (parentIdName == 'comment' || currentID == 'commment') {
        highlightText('#dc3545', range, true);
        //Youssef's comment
        closeToolTip();
      } else if (parentIdName == 'note' || currentID == 'note') {
        highlightText('blue', range, true);
        // Implement note
        closeToolTip();
      }
    });

    //Fix this, WE SHOULD ONLY MANIPULATE P TAGS

    const highlightText = (color, range, underline=false) => {
      var mark = document.createElement('mark')
      if (underline) {
        console.log("UNDERLINING")
        mark = document.createElement('u');
        mark.style.textDecoration = "underline";
        mark.style.textDecorationColor = color;
        mark.style.textDecorationThickness = ".2rem";
        mark.style.textDecorationSkipInk = "none"
      } else {
        mark.style.backgroundColor = color;
        mark.style.textDecoration = 'none';
      }
      mark.textContent = range.toString();
      range.deleteContents();
      range.insertNode(mark);
    };
  }
}

function deactivateReliant() {
  ACTIVATED = false;
  console.log('Deactivating Reliant');
  removeQuestionnaire();
  var i = 0;
  for (const paragraph of paragraphs) {
    paragraph.style['background-color'] = colors[i][0];
    i++;
  }
}


//Runs when activate is pressed from Popup
chrome.runtime.onMessage.addListener((req, send, sendResponse) => {
  if (req.type === 'activate') {
    activateReliant();
  } else if (req.type === 'getAuthors') {
    getURL().then((url) => {
      sendResponse(authorName(new URL(url).hostname));
    });
  } else if (req.type === 'deactivate') {
    deactivateReliant();
  }
  return true;
});
