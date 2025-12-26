# Budget Tracker App

A simple and elegant web application to track your budget and expenses with support for multiple budget categories.

## Features

- **Multiple Budget Categories**: Create separate budgets for different categories (Food, Entertainment, Transportation, etc.)
- **Category-Based Tracking**: Each budget category shows its own spent amount and balance
- **Overall Budget View**: See total budget, total spent, and overall balance across all categories
- **Add Expense Items**: Add items with names, costs, and assign them to categories
- **Real-time Calculations**: Automatically calculates balances and shows surplus/deficit
- **Visual Indicators**: Surplus shown in green (+), deficit shown in red (-)
- **Data Persistence**: All data persists in browser localStorage
- **Clean, Modern UI**: Responsive design with gradients and smooth animations

## How to Use

1. Open `index.html` in your web browser
2. **Add Budget Categories**:
   - Enter a category name (e.g., "Food", "Entertainment")
   - Enter the budget amount for that category
   - Click "Add Budget"
   - Repeat for multiple categories
3. **Add Expense Items**:
   - Select a category from the dropdown
   - Enter the item name and cost
   - Click "Add Item"
4. **View Your Budget**:
   - Each category shows: Budget amount, Spent, and Balance
   - Overall summary shows: Total Budget, Total Spent, and Overall Balance
   - Green (+) indicates surplus, Red (-) indicates deficit
5. **Manage Data**:
   - Delete individual items or categories
   - Clear all data with one button

## Technologies Used

- HTML5
- CSS3 (with gradients and modern styling)
- Vanilla JavaScript (ES6+)
- LocalStorage for data persistence

## File Structure

- `index.html` - Main HTML structure
- `style.css` - All styling and responsive design
- `script.js` - Budget tracking logic and calculations
- `README.md` - This file

## Features Explained

### Budget Display
- **Total Budget**: The amount you've set as your budget
- **Total Spent**: Sum of all expense items
- **Balance**: Shows surplus (+) in green or deficit (-) in red

### Data Persistence
Your budget and items are automatically saved to browser localStorage, so they persist even after closing the browser.

## Running the App

Simply open `index.html` in any modern web browser. No server or build process required!
