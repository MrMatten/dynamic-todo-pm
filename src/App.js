import logo from './logo.svg';
import './App.css';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useEffect, useState } from 'react'

function App() {
  const [inputText, setInputText] = useState('');
  const [eventData, setEventData] = useState({
    isEvent: false,
    date: '',
    attendees: [],
    location: '',
  });
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const defaultPrompt = `
In the text above find out if someone is trying to plan an event and return relevant information using the following JSON schema:
PlannedEvent = {'isEvent': boolean, date': date-time, 'attendees': Array<string>, 'location': string}
Return: PlannedEvent
If you think the text is the beginning of planning an event you set isEvent to true. If you can extract data do that. Removing any formatting from the returned text`

  const handleInputChange = (e) => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const text = e.target.value;
    setInputText(text);

    const timeout = setTimeout(async () => {
      const prompt = text + "\n" + defaultPrompt; 

      const result = await model.generateContent(prompt);
      const normalisedResponse = removeFirstAndLastLine(result.response.text());
      const json = JSON.parse(normalisedResponse);

      const {isEvent, date, attendees, location} = json 
      setEventData(() => ({
        isEvent,
        date: date || "unknown",
        attendees: attendees || ["unknown"],
        location: location || "unknown"
      }))
    }, 800);

    setDebounceTimeout(timeout);
  }

  // Adjusted from ChatGPT. Used to normalise json from gemini-2 as it returns with text formatting ```json [...] ```
  const removeFirstAndLastLine = (text) => {
    // Trim any extra whitespace or newlines from the start and end
    const trimmedText = text.trim();

    // Split the text into an array of lines
    const lines = trimmedText.split('\n');

    // If there are fewer than 3 lines, we can't remove both the first and last
    if (lines.length <= 2) {
      return ''; // If there are only 1 or 2 lines, return an empty string
    }

    // Remove the first and last lines, and join the remaining lines back into a string
    return lines.slice(1, -1).join('\n');
  }

  return (
    <div className="App">
        {eventData.isEvent &&
        <div className="event-box">
          <div className="event-title">New Event</div>
          <div className="event-detail">
              <span>Time</span>
              <span className="blur-text">{eventData.date}</span>
          </div>
          <div className="event-detail">
              <span>Location</span>
              <span className="blur-text">{eventData.location}</span>
          </div>
          <div className="event-detail">
              <span>Attendees</span>
              <span className="blur-text">{eventData.attendees}</span>
          </div>
        </div>
        }
        <div className="input-container">
          <input value={inputText} onChange={handleInputChange} type="text" placeholder="Enter event details ..." />
        </div>
    </div>
  );
}

export default App;
