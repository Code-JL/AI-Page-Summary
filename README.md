# AI Page Summary  - Chrome Extension

A powerful Chrome extension that generates concise, intelligent summaries of web pages using advanced AI technology. Perfect for researchers, students, and professionals who need quick insights from lengthy content.

## Features

- **One-Click Summaries**: Generate instant summaries of any web page
- **Customizable Length**: Choose the number of sentences (1-10) for your summary
- **Auto-Summarize**: Automatically generate summaries when visiting new pages
- **Dark/Light Theme**: Toggle between themes for comfortable viewing
- **Copy Function**: Easily copy summaries to clipboard
- **History Tracking**: Keep track of your recent page summaries
- **Protected URL Detection**: Smart handling of browser-specific and protected URLs

## Installation

1. Clone this repository or download the ZIP file
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon in your Chrome toolbar
2. Adjust settings as needed:
   - Set desired sentence count
   - Toggle auto-summarize feature
   - Switch between light/dark themes
3. Click "Summarize Page" or wait for auto-summary
4. Copy the generated summary with one click

## Technology

- Uses Hugging Face's BART-large-CNN model for summarization
- Chrome Extension Manifest V3
- Modern JavaScript with async/await
- Clean, responsive UI design

## Permissions

- activeTab: Access current tab content
- storage: Save user preferences
- scripting: Process page content
- host permissions: Generate summaries from any webpage

## Contributing

Contributions are welcome! Feel free to submit pull requests or open issues for any bugs or feature requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

[Code-JL](https://github.com/Code-JL)
