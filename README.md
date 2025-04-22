# ReceiptWiser

ReceiptWiser is a web application that allows users to scan receipts, analyze them using OpenAI's Vision API, edit the details, and share them with friends for easy bill splitting.

## Features

- **Receipt Scanning**: Upload images of receipts for automatic analysis
- **AI-Powered Analysis**: Uses OpenAI's Vision API to extract items, quantities, prices, and tax information
- **Interactive Editor**: Edit extracted receipt data, add/remove items, and adjust prices
- **Shareable Links**: Generate and share links containing receipt data with friends
- **Bill Splitting**: Recipients can select their items and see their portion of the bill
- **Responsive Design**: Works on both desktop and mobile devices

## Technology Stack

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: OpenAI API with Vision capabilities
- **Data Compression**: LZ-String for URL parameter compression

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/StreetLamb/receiptwiser.git
   cd receiptwiser
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Run the development server:
   ```bash
   turbo dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Usage Guide

### Uploading a Receipt

1. On the home page, click on the upload area or drag and drop a receipt image.
2. The application will send the image to OpenAI's Vision API for analysis.
3. If you don't have a valid OpenAI API key, the application will use mock data for testing.

### Editing Receipt Details

1. Once the receipt is analyzed, you'll see the extracted items, quantities, and prices.
2. Edit any incorrect information by clicking on the respective fields.
3. Add new items using the "Add Item" button.
4. Remove items using the "Delete" button next to each item.
5. Adjust tax percentage if needed.

### Sharing with Friends

1. After finalizing the receipt details, click the "Share Receipt" button.
2. A shareable link will be generated and copied to your clipboard.
3. Share this link with friends who were part of the bill.

### Viewing a Shared Receipt

1. When opening a shared link, you'll see the receipt details.
2. Select the items you ordered by checking the boxes.
3. Adjust quantities if needed.
4. See your portion of the bill, including tax, at the bottom.

## Configuration

### Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key for receipt analysis.

## Troubleshooting

### Common Issues

- **API Key Issues**: Ensure your OpenAI API key is valid and has sufficient credits.
- **Image Upload Problems**: Make sure your image is in a supported format (JPEG, PNG, HEIC).
- **Shared Link Errors**: If a shared link doesn't work, it may be corrupted or too long.

### Debugging

- Check the browser console for detailed error messages.
- Server logs provide information about API calls and processing.
- The application includes extensive error handling and logging to help diagnose issues.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
