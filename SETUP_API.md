# ResQFlow - Gemini API Setup & Troubleshooting Guide

## Quick Setup (3 steps)

### 1. Get Your Free Google Gemini API Key
- Visit: **https://aistudio.google.com/app/apikey**
- Sign in with your Google account (create free if needed)
- Click **"Create API Key"**
- Copy the generated key from Google AI Studio

### 2. Create local config
- Copy `config.example.js` to `config.local.js`
- Paste your actual key into `config.local.js`:
  ```javascript
  window.RESQFLOW_CONFIG = {
    GEMINI_API_KEY: "paste-your-gemini-api-key-here"
  };
  ```
- `config.local.js` is ignored by git and should not be committed.
- **Important**: No extra spaces! Copy the key exactly.
- Save the file (Ctrl+S)

### 3. Refresh Your Browser
- Press **F5** or **Ctrl+R** to refresh
- The topbar status should change to **"LIVE MODE (Gemini API)"** with a green dot ✅
- Open the **Chatbot** tab and test with a question

---

## ✅ What Works After Setup

✅ **Live AI Responses** - Real-time answers powered by Google Gemini  
✅ **Context Awareness** - Bot remembers your conversation history  
✅ **Disaster Guidance** - Floods, earthquakes, fires, cyclones, landslides  
✅ **Emergency Contacts** - NDRF, Fire, Police, Ambulance numbers  
✅ **Evacuation Routes** - Shelter locations and escape procedures  
✅ **First Aid Tips** - Medical emergency guidance  
✅ **Image/Video Analysis** - Upload photos/videos for Gemini Vision assessment  
✅ **Voice Input** - Record and transcribe audio questions in selected language  
✅ **Multilingual** - English, Hindi, Tamil, Bengali, Telugu  

---

## 🧪 Test Queries

Try asking the chatbot any of these:
- "How do I prepare for a flood?"
- "What should I do during an earthquake?"
- "I see a fire nearby, what are my options?"
- "Where's the nearest shelter in Delhi?"
- "What's the emergency number for fires?"
- "बाढ़ में क्या करें?" (Hindi: What to do in a flood?)

---

## 🔴 Troubleshooting

### **Status shows "DEMO MODE (No API)" (Yellow)**
- **Cause**: API key not configured
- **Fix**: Follow steps 1-2 above and refresh browser

### **Error: "Invalid API key" / "401 Unauthorized"**
- **Cause**: Key is wrong, expired, or has extra spaces
- **Fix**: 
  1. Go to https://aistudio.google.com/app/apikey
  2. Generate a NEW key
  3. Copy carefully (no spaces!)
  4. Replace in ResQFlow.jsx line 5
  5. Refresh browser

### **Error: "Rate limit exceeded" (429)**
- **Cause**: Too many requests in short time
- **Fix**: 
  - Free tier: 60 requests per minute
  - Wait 1-2 minutes before trying again
  - Upgrade plan at https://console.cloud.google.com for higher limits

### **Error: "Network Error" or "Failed to fetch"**
- **Cause**: Internet connection issue or CORS blocking
- **Fix**:
  1. Check internet connection
  2. Open browser console: Press **F12**
  3. Look for detailed error message
  4. Try a simpler question first
  5. If running locally, this is sometimes expected

### **Blank/No Response Message**
- **Cause**: API response parsing error
- **Fix**:
  1. Press **F12** to open Developer Tools
  2. Click **Console** tab
  3. Look for error messages
  4. Take a screenshot and check the exact error
  5. Try a different question

### **Chatbot responds with demo answers instead of real AI**
- **Cause**: API key is not valid or recognized
- **Fix**:
  1. Verify your key is pasted in `config.local.js`
  2. No spaces before/after the key!
  3. Key must be between quotes
  4. Refresh the page
  5. Check topbar - should say "LIVE MODE"

### **"Check browser console for details"**
- **Fix**:
  1. Press **F12** to open Developer Console
  2. Click the **Console** tab (red errors will show)
  3. Look for messages from ResQFlow
  4. Error messages will show exactly what went wrong
  5. Share the exact error if you need help

---

## 🐛 Debug Checklist

Before asking for help, verify:
- [ ] Browser shows "LIVE MODE (Gemini API)" with green dot
- [ ] You're on the **Chatbot** tab (not Dashboard)
- [ ] You have internet connection
- [ ] Your question is clear and specific
- [ ] Browser console (F12) shows no red errors
- [ ] API key doesn't have extra spaces
- [ ] API key is present in `config.local.js`
- [ ] You've waited at least 1-2 minutes between requests (if got rate limit error)

---

## 📊 API Limits & Costs

| Aspect | Details |
|--------|---------|
| **Free Tier** | 60 requests per minute |
| **Cost** | FREE (as of March 2026) |
| **Per Request Limit** | Up to 1,000 tokens |
| **Languages Supported** | 100+ languages |
| **Response Time** | ~2-5 seconds typically |

### How to Increase Limits
1. Visit https://console.cloud.google.com
2. Upgrade your Google Cloud plan
3. Increase quota in API settings
4. No code changes needed

---

## 🔒 Security & Best Practices

### Current Setup (DEMO Environment)
- API key is embedded in browser code
- Anyone can see your key in page source
- Anyone with the key can use your quota

### For Production Deployment
- **Hide the key** - Move API calls to a backend server
- **Use backend** - Frontend talks to your backend, backend talks to Gemini
- **Environment variables** - Store key in backend .env file
- **Rate limiting** - Implement on your backend
- **Authentication** - Add user authentication

### If Key Gets Compromised
1. Go to https://aistudio.google.com/app/apikey
2. Delete the old key
3. Generate a NEW key
4. Update ResQFlow.jsx
5. Refresh browser
- The old key will stop working immediately

---

## 💡 Tips for Best Results

1. **Ask specific questions** - Vague questions get vague answers
2. **Use your language** - Bot responds in the language you choose (EN/HI/TA/BN/TE)
3. **Follow up** - Bot remembers context, so follow-up questions work better
4. **Clear prompts** - "What should I do if..." gets better results than "help me"
5. **Wait between questions** - Don't spam; give the API time to respond

---

## 🆘 Still Not Working?

1. **Open browser console**: Press **F12** → **Console** tab
2. **Screenshot the errors**: Capture any red error messages
3. **Note the exact error**: Copy the error text
4. **Check this guide**: Search for your exact error message above
5. **Ask for help**: Share:
   - The exact error message from console
   - Steps you've tried
   - Whether `config.local.js` exists and is loaded by the browser

---


## Additional Features (Coming Soon)

- Audio input (voice commands)
- Image analysis (damage assessment)
- Real-time location detection
- SMS alerts integration
- Multi-user support

---

**Questions?** Check the browser console (F12) for detailed error messages.
