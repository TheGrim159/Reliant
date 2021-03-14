import React from 'react';
import { render } from 'react-dom';
import Questionnaire from './modules/Questionnaire';
import Comment from './modules/Comment';
import { URLS } from '../Background/workingUrls';
import axios from 'axios';
import { calculateScore } from '../../containers/Score/Score';
import ToolComponent from './modules/Tooltip';

console.log('Content script works!');
console.log('Must reload extension for modifications to take effect.');

const comment = document.createElement('div')
const questionnaire = document.createElement('div')
var ACTIVATED = false;
var LOADED = false;
var paragraphs = null;

document.querySelector('div').addEventListener('selectionchange', () => {
  console.log('Selection updated');
});

export function getLoadedState() {return LOADED}
export function getActivateState() {return ACTIVATED}

export async function getURL() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage('activeURL', (url) => {
      resolve(url);
    });
  });
}

function createQuestionnaire(userId, url, hostname) {
  console.log('Creating Questionare for', hostname);
  var contentBody = null;
  var genre = "";
  if (hostname.includes(URLS.WIRED)) {
    console.log("We're on WIRED");
    contentBody = document.getElementsByClassName('article main-content')[0];
    genre = 'Tech';
  } else if (hostname.includes(URLS.CNN)) {
    console.log("We're on CNN");
    contentBody = document.getElementById('body-text');
    genre = 'Political';
  } else if (hostname.includes(URLS.VERGE)) {
    console.log("We're on Verge");
    contentBody = document.getElementsByClassName('c-entry-content ')[0];
    genre = 'Tech';
  } else if (hostname.includes(URLS.VOX)) {
    console.log("We're on Vox");
    contentBody = document.getElementsByClassName('c-entry-content ')[0];
    genre = 'Political';
  } else if (hostname.includes(URLS.FOXNEWS)) {
    console.log("We're on Fox");
    contentBody = document.getElementsByClassName('article-body')[0];
  } else if (hostname.includes(URLS.MEDIUM)) {
    console.log("We're on Medium");
    contentBody = document.getElementsByTagName('article')[0];
    genre = 'Education';
  } else if (hostname.includes(URLS.NYTIMES)) {
    console.log("We're on NY Times");
    contentBody = document.getElementsByClassName('bottom-of-article')[0];
    genre = 'Political';
  }
  if (contentBody == undefined) {
    const articles = document.getElementsByTagName('article');
    if (articles.length > 0) {
      contentBody = articles[articles.length -1]
    } else {
      contentBody = document.querySelector('body');
    }
  }
  contentBody.appendChild(questionnaire);
  contentBody.appendChild(comment);
  console.log("Content Body" , contentBody)
  render(<Comment />, comment)
  render(<Questionnaire userId={userId} url={url} genre={genre} />, questionnaire);
}

async function getUserInfo() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage('userInfo', (userInfo) => {
      resolve(userInfo);
    });
  });
}


function authorName(hostname) {
  var author = [];
  var removeText;
  var spaceCount = 0;
  if (hostname.includes(URLS.WIRED)) {
    author.push(document.getElementsByName("author")[0].content);
    console.log(author);
  } else if (hostname.includes(URLS.CNN)) {
    removeText = document.getElementsByName("author")[0].content;
    removeText = removeText.substr(0,removeText.length-5);
    if (removeText.includes("and")) {
      removeText = removeText.replace("and ", "");
      for (let i in removeText) {
        if (spaceCount == 2) {
          author.push(removeText.substr(0,i-1));
          author.push(removeText.substr(i));
          spaceCount +=1;
        }
        if (removeText[i].includes(" ")) {
          spaceCount += 1;
        }
      }
    } else {
      author.push(removeText);
    }
    console.log(author);
  } else if (hostname.includes(URLS.VERGE)) {
    author.push(document.getElementsByTagName("meta")[5].content);
    console.log(author);
  } else if (hostname.includes(URLS.VOX)) {
    author.push(document.getElementsByTagName("meta")[5].content);
    console.log(author);
  } else if (hostname.includes(URLS.FOXNEWS)) {
    author.push(document.getElementsByName("dc.creator")[0].content);
    console.log(author);
  } else if (hostname.includes(URLS.MEDIUM)) {
    author.push(document.getElementsByName("author")[0].content);
    console.log(author);
  } else if (hostname.includes(URLS.NYTIMES)) {
    removeText = document.getElementsByName("byl")[0].content;
    removeText = removeText.replace("By ", "");
    if (removeText.includes("and")) {
      removeText = removeText.replace("and ", "");
      for (let i in removeText) {
        if (spaceCount == 2) {
          author.push(removeText.substr(0,i-1));
          author.push(removeText.substr(i));
          spaceCount +=1;
        }
        if (removeText[i].includes(" ")) {
          spaceCount += 1;
        }
      }
    }
    else {
      author.push(removeText);
    }
    console.log(author);
  } else {
    if (document.getElementsByName("author")[0].content != null) {
      author.push(document.getElementsByName("author")[0].content);
    } else if (document.getElementsByTagName("meta")[5].content != null) {
      author.push(document.getElementsByTagName("meta")[5].content);
    } else {
      author.push("Sorry IDK")
    }
  }
  return author;
}


function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

var first = true; //Used to ensure the questionnaire can only be injected once.
var colors = []; // Array holding paragraph colors in the form [original, random]
var even = 0; // 0 --> Original Color, 1 --> Random Color
window.onload = async function () {
  LOADED = true;
  console.log('LOADED');
  const hostname = new URL(await getURL()).hostname;
  console.log(hostname)
  for (const key in URLS) {
    if (hostname.includes(URLS[key])) {
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
  const url = await getURL();
  const userInfo = await getUserInfo();
  const hostname = new URL(url).hostname;
  //Check if hostname is in URLS
  // var foundURL = false;
  // for (const key in URLS) {
  //   if (hostname.includes(URLS[key])) {
  //     foundURL = true;
  //     break;
  //   }
  // }
  // if (!foundURL) {
  //   console.log('UNSUPPORTED WEBSITE');
  //   return;
  // }

  axios
    .post('http://localhost:4000/api/user/updateSites', {
      _id: userInfo.id,
      website: {
        _id: url,
        timespent: 5,
      },
    })
    .then(() => {
      console.log('Data has been sent to the server');
    })
    .catch(() => {
      console.log('Internal server error');
    });

  axios
    .post('http://localhost:4000/api/websites/addSite', {
      _id: url,
    })
    .then((response) => {
      console.log(response);
    })
    .catch(() => {
      console.log('Internal server error');
    });

  if (first) {
    createQuestionnaire(userInfo.id, url, hostname);

  //Highlight everything
  even = (even + 1) % 2;

  let tooltip = document.createElement('span');
  tooltip.className = 'tool_tip';



 document.body.appendChild(tooltip);

let isToolTipVisible = false;
let lastSelection = null;
let lastSelectionObj = null;

  render(<ToolComponent>aa</ToolComponent>, tooltip);
  tooltip.style.position = 'absolute';
  tooltip.style.visibility = 'hidden';
  tooltip.style.display = 'none';


  const renderToolTip = (mouseX, mouseY, selection) => {
    mouseX = mouseX - 50;
    mouseY = mouseY - 40;
    tooltip.style.top = mouseY + 'px';
    tooltip.style.left = mouseX + 'px';
    tooltip.style.visibility = 'visible';
    tooltip.style.display = 'block';
    isToolTipVisible = true;
  };

  var startX = 0;
  var endX = 0;
  var startY = 0;
  var endY = 0;

  //Close the tool tip
  document.addEventListener('mousedown', (e)=> {  
    const parentClassName = e.target.parentNode.getAttribute('class');
    const parentIdName = e.target.parentNode.getAttribute('id'); 
    console.log("Parent Class:", parentClassName);
    console.log("Parent ID:", parentIdName);
    //Make the tool tip invisible
    if (isToolTipVisible)  {
      e.stopPropagation();
      return false;
    } else {
      startX = e.pageX
      startY = e.pageY
      
    tooltip.style.visibility = 'hidden'
    tooltip.style.display = 'none'
    isToolTipVisible= false;
  }
  })
  // Show the tool tip
  let paragraphs = document.getElementsByTagName('p');
  document.addEventListener('mouseup', (e)=> {
    console.log(window.getSelection());
    let selection = window.getSelection().toString();
    console.log("Current selection", selection);
    console.log("Last selection", lastSelection);
    if (selection == lastSelection && isToolTipVisible) {
      e.stopPropagation();
      return false;
    } else if (selection.length > 0) {
      //Render the tooltip
      endX = e.pageX
      endY = e.pageY
      console.log("start x is ", startY)
      console.log("end x is ", endY)

      const realStartX = Math.min(startX, endX)
      const realendX = Math.max(startX, endX)

      const realStartY = Math.min(startY, endY)
      const realEndY = Math.max(startY, endY)
      lastSelection = selection;
      lastSelectionObj = window.getSelection();
      renderToolTip((realendX - realStartX)/2 + realStartX, realStartY - (realEndY - realStartY)/2, selection)
    } else {
      tooltip.style.visibility = 'hidden'
      tooltip.style.display = 'none'
      isToolTipVisible= false;
    }
  })


  //Highlight options
  document.addEventListener('click', (e)=> {
    const parentIdName = e.target.parentNode.getAttribute('id'); 
    const currentID = e.target.getAttribute('id')

    if (parentIdName == 'highlight' || currentID == 'highlight') {
      highlightText('#ffc107')
    } else if (parentIdName == 'smile' || currentID == 'smile') {
      highlightText('#28a745')
    } else if (parentIdName == 'frown' || currentID == 'frown') {
      highlightText('#dc3545')
    } else if (parentIdName == 'comment' || currentID == 'commment') {
      //Youssef's comment
    } else if (parentIdName == 'note' || currentID == 'note') {
      // Implement note
    }
  })

  const highlightText = (color) =>{
    const mark = document.createElement('mark');
    mark.style.backgroundColor = color;
    mark.textContent = lastSelection
    const range = lastSelectionObj.getRangeAt(0);
    range.deleteContents();
    range.insertNode(mark);
  };
  
  
  //paragraphs = Array.from(paragraphs);
  // render(<Highlight children={paragraphs}/>, paragraphs);
 // console.log(paragraphs);
//  console.log('before highlightpop', paragraphs[0]);
  // grab the 0th indx para
  // grab teh last indx parag

  // div called big div
  // bigdiv.appendBefore 0th index paragraph
  // bigdiv.append lastindex pargarph

/*   let highlightWrapper = document.createElement('span');
  highlightWrapper.id = 'highlight_tool';

  const firstParagarph = paragraphs[0];
  const contentBody = document.getElementsByClassName('c-entry-content ')[0];
  contentBody.appendChild(highlightWrapper);
  highlightWrapper.appendChild(firstParagarph);
  console.log(highlightWrapper);

  const last = paragraphs[paragraphs.length - 1];
  console.log('before wrapping');
  //firstParagarph.parentNode.replaceChild(highlightWrapper, firstParagarph);

  highlightWrapper.parentNode.appendChild(firstParagarph);

  render(
    <HighlightPop onHighlightPop={() => console.log('Highlighting')}>
      <p>Hello, this is a testing tag</p>
    </HighlightPop>,
    highlightWrapper
  ); */
  console.log('after wrapping');
  //   for (const paragraph of paragraphs) {
  //     // console.log(paragraph.textContent)
  //     // if (first) {
  //     //   colors.push([paragraph.style['background-color'], getRandomColor()]);
  //     //   paragraph.style['background-color'] = colors[i][1];
  //     // } else {
  //     //   paragraph.style['background-color'] = colors[i][even];
  //     // }
  //     const highlightWrapper = document.createElement('div');

  //     //console.log(paragraph);
  //     //paragraph.parentNode.insertBefore(highlight, paragraph);
  //     console.log(
  //       '==== Highlight react component should be wrapped at this point ===='
  //     );
  //     paragraph.parentNode.replaceChild(highlightWrapper, paragraph);

  //     highlightWrapper.appendChild(paragraph);

  //     render(
  //       <HighlightPop onHighlightPop={() => console.log('Highlighting')} />,
  //       highlightWrapper
  //     );
  //   }
  //   first = false;
}
}

function deactivateReliant() {
  ACTIVATED = false;
  console.log("Deactivating Reliant")
  comment.remove();
  questionnaire.remove();
  var i = 0
  for (const paragraph of paragraphs) {
    paragraph.style['background-color'] = colors[i][0];
    i++;
  }
}

 export async function submitQuestionnaire(score) {
  //Logic for submitting questionarre
  const userInfo = await getUserInfo();
  const url = await getURL();
  //create/update review
  var results = [];
  var overallScore = 0;
  for (const s in score) {
    overallScore += score[s].score;
    results.push({
      _id: s,
      response: score[s].score,
    });
  }
  overallScore /= Object.keys(score).length;

  await axios
    .post('http://localhost:4000/api/reviews/addReview', {
      _id: {
        userId: userInfo.id,
        url: url,
      },
      results: results,
      overallScore: overallScore,
    })
    .then((res) => {
      console.log('Successfully saved review');
    })
    .catch((err) => {
      console.log('Error from addReview:', err);
      throw err;
    })
  };
  //TODO: Implement the two push calls below which save the review to the reviews collection and update the reliability score
  // axios
  //   .push('http://localhost:4000/api/reviews', {
  //     _id: { userId: userInfo.id, url: url },
  //   })
  // })
  /* Necessary Inputs:
  oldWebsiteScore = reliability score of url from the database (default 0)
  oldWebsiteWeight = number of reviews of url (default 0 ) -- this accounts for review weights
  oldUserScore = rating of review made by same user on same website earlier (0 if first time)
  oldUserWeight = calculated weight made from previous review (0 if first time)
  totalTimeOpened = number of seconds article has been read (stored time + current session time)
  newUserScore = the score given by the user by the current questionnaire
  document = document of HTML, already good as-is
  Outputs:
  r[0] = new reliability score of url
  r[1] = new total weight of url (number of reviews)
  r[2] = userScore
  r[3] = userWeight --> r[2], r[3] used to store in Reviews
  */
  // calculateScore(
  //   oldWebsiteScore,
  //   oldWebsiteWeight,
  //   oldUserScore,
  //   oldUserWeight,
  //   totalTimeOpened,
  //   newUserScore,
  //   documentObj
  // );
  

//Runs when activate is pressed from Popup
chrome.runtime.onMessage.addListener((req, send, sendResponse) => {
  if (req.type === 'activate') {
    activateReliant();
  } else if (req.type === "getAuthors") {
    getURL().then((url) => {
      sendResponse(authorName(new URL(url).hostname))
    })
  } else if (req.type === 'deactivate') {
    deactivateReliant();
  }
  return true;
});
