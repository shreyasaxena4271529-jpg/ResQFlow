# 🚨 ResQFlow Chatbot Not Responding? Quick Fix

## Issue
Chatbot shows responses from demo mode, not real-time AI responses.

---

## ✅ 3-Step Fix

### Step 1: Get API Key (2 minutes)
```
👉 Go to: https://aistudio.google.com/app/apikey
✅ Sign in with Google (free account)
✅ Click "Create API Key"
✅ Copy the key from Google AI Studio
```

### Step 2: Update ResQFlow.jsx (1 minute)
```
1. Open ResQFlow.jsx in VS Code
2. Copy `config.example.js` to `config.local.js`
3. Paste your key into `config.local.js`
4. Save file (Ctrl+S)
```

### Step 3: Refresh Browser (30 seconds)
```
1. Refresh page (F5 or Ctrl+R)
2. Look at topbar - should say "LIVE MODE (Gemini API)" ✅ GREEN
3. Go to Chatbot tab
4. Send a test message
```

---

## 🐛 If Still Not Working

**Open browser console** (Press F12):
- Look for RED error messages
- Copy the error
- Check these common errors:

| Error | Fix |
|-------|-----|
| "Invalid API key" | Key is wrong or expired - get a new one from Step 1 |
| "Rate limit exceeded" | Wait 1-2 minutes |
| "Network Error" | Check internet connection |
| "401 Unauthorized" | Key has spaces or is wrong - copy again carefully |

---

## ✨ Working Now?

Your chatbot should now:
- ✅ Respond with real-time AI answers
- ✅ Remember conversation context
- ✅ Support 5 languages (EN/HI/TA/BN/TE)
- ✅ Answer about disasters, emergencies, first aid
- ✅ Provide real-time guidance

---

## 💡 Test with:
- "What should I do in a flood?"
- "बाढ़ में क्या करूँ?" (Hindi)
- "How do I call emergency services?"
- "What's first aid for burns?"

---

## 📖 Full Documentation
See **SETUP_API.md** for complete setup and troubleshooting guide.
