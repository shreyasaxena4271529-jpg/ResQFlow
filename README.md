# ResQFlow
It is an AI-powered disaster response systems use machine learning for prediction, real-time monitoring, and resource coordination to save lives during floods, earthquakes, or fires. AI prediction models for floods/earthquakes using weather/seismic data. detection from videos/images, inspired by open-source repos. Multilingual chatbot (Gemini API) for FAQs and alerts. It responds to text, audio, video/picture inputs.
Project Details :-
Dashboard — Live incident counter, evacuation stats, AI risk prediction bars (flood/earthquake/fire/cyclone), a satellite threat map with animated pins, and a live seismic waveform monitor.
Alerts — Prioritized incident feed (critical → warning → info) with disaster type, location, and timestamps. Includes a broadcast emergency alert button.
Chatbot — Multilingual assistant (EN/HI/TA/BN/TE toggle) powered by Gemini API with text/audio/image-video mode switching. Smart routing — asking about "flood" or "बाढ़" triggers flood-specific protocols with NDRF contacts and shelter locations.
Detection — AI vision uploader simulating YOLOv8 + ResNet-50 inference on images/video, with a detection log showing fire, flood, crowd density, and structural damage results with confidence scores.
Resources — Live resource utilization bars (rescue teams, helicopters, boats, shelters) and deployed team zone status across India.
