// Budget Tracker App with Multiple Categories
class BudgetTracker {
    constructor() {
        this.budgetCategories = [];
        this.items = [];
        this.init();
    }

    init() {
        // Load data from localStorage
        this.loadData();

        // Get DOM elements
        this.categoryInput = document.getElementById('category-input');
        this.budgetInput = document.getElementById('budget-input');
        this.setBudgetBtn = document.getElementById('set-budget-btn');
        this.itemCategorySelect = document.getElementById('item-category');
        this.itemNameInput = document.getElementById('item-name');
        this.itemCostInput = document.getElementById('item-cost');
        this.addItemBtn = document.getElementById('add-item-btn');
        this.clearAllBtn = document.getElementById('clear-all-btn');
        this.budgetCategoriesList = document.getElementById('budget-categories-list');
        this.itemsList = document.getElementById('items-list');

        // Add event listeners
        this.setBudgetBtn.addEventListener('click', () => this.addBudgetCategory());
        this.addItemBtn.addEventListener('click', () => this.addItem());
        this.clearAllBtn.addEventListener('click', () => this.clearAll());

        // Enter key support
        this.budgetInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addBudgetCategory();
        });

        this.categoryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addBudgetCategory();
        });

        this.itemNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addItem();
        });

        this.itemCostInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addItem();
        });

        // Initial render
        this.render();
    }

    addBudgetCategory() {
        const categoryName = this.categoryInput.value.trim();
        const budgetAmount = parseFloat(this.budgetInput.value);

        if (!categoryName) {
            alert('Please enter a category name');
            return;
        }

        if (isNaN(budgetAmount) || budgetAmount < 0) {
            alert('Please enter a valid budget amount');
            return;
        }

        // Check if category already exists
        const existingCategory = this.budgetCategories.find(
            cat => cat.name.toLowerCase() === categoryName.toLowerCase()
        );

        if (existingCategory) {
            alert('This category already exists. Delete it first if you want to change it.');
            return;
        }

        const category = {
            id: Date.now(),
            name: categoryName,
            budget: budgetAmount
        };

        this.budgetCategories.push(category);
        this.categoryInput.value = '';
        this.budgetInput.value = '';
        this.categoryInput.focus();

        this.saveData();
        this.render();
    }

    deleteBudgetCategory(id) {
        // Check if there are items in this category
        const categoryItems = this.items.filter(item => item.categoryId === id);

        if (categoryItems.length > 0) {
            if (!confirm(`This category has ${categoryItems.length} item(s). Delete anyway?`)) {
                return;
            }
            // Remove all items in this category
            this.items = this.items.filter(item => item.categoryId !== id);
        }

        this.budgetCategories = this.budgetCategories.filter(cat => cat.id !== id);
        this.saveData();
        this.render();
    }

    addItem() {
        const categoryId = parseInt(this.itemCategorySelect.value);
        const name = this.itemNameInput.value.trim();
        const cost = parseFloat(this.itemCostInput.value);

        if (!categoryId) {
            alert('Please select a category');
            return;
        }

        if (!name) {
            alert('Please enter an item name');
            return;
        }

        if (isNaN(cost) || cost < 0) {
            alert('Please enter a valid cost');
            return;
        }

        const item = {
            id: Date.now(),
            categoryId: categoryId,
            name: name,
            cost: cost
        };

        this.items.push(item);
        this.itemNameInput.value = '';
        this.itemCostInput.value = '';
        this.itemNameInput.focus();

        this.saveData();
        this.render();
    }

    deleteItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.saveData();
        this.render();
    }

    clearAll() {
        if (this.items.length === 0 && this.budgetCategories.length === 0) {
            return;
        }

        if (confirm('Are you sure you want to clear all data?')) {
            this.budgetCategories = [];
            this.items = [];
            this.saveData();
            this.render();
        }
    }

    getCategorySpent(categoryId) {
        return this.items
            .filter(item => item.categoryId === categoryId)
            .reduce((total, item) => total + item.cost, 0);
    }

    getCategoryBalance(category) {
        return category.budget - this.getCategorySpent(category.id);
    }

    getTotalBudget() {
        return this.budgetCategories.reduce((total, cat) => total + cat.budget, 0);
    }

    getTotalSpent() {
        return this.items.reduce((total, item) => total + item.cost, 0);
    }

    getTotalBalance() {
        return this.getTotalBudget() - this.getTotalSpent();
    }

    formatCurrency(amount) {
        return '$' + amount.toFixed(2);
    }

    getCategoryName(categoryId) {
        const category = this.budgetCategories.find(cat => cat.id === categoryId);
        return category ? category.name : 'Unknown';
    }

    render() {
        // Update overall budget display
        document.getElementById('total-budget').textContent = this.formatCurrency(this.getTotalBudget());
        document.getElementById('total-spent').textContent = this.formatCurrency(this.getTotalSpent());

        const totalBalance = this.getTotalBalance();
        const balanceElement = document.getElementById('balance');
        balanceElement.textContent = this.formatCurrency(Math.abs(totalBalance));

        // Update balance color and sign
        balanceElement.classList.remove('surplus', 'deficit');
        if (totalBalance > 0) {
            balanceElement.classList.add('surplus');
            balanceElement.textContent = '+' + this.formatCurrency(totalBalance);
        } else if (totalBalance < 0) {
            balanceElement.classList.add('deficit');
            balanceElement.textContent = '-' + this.formatCurrency(Math.abs(totalBalance));
        }

        // Render budget categories
        this.renderBudgetCategories();

        // Update category select options
        this.updateCategorySelect();

        // Render items list
        this.renderItems();
    }

    renderBudgetCategories() {
        if (this.budgetCategories.length === 0) {
            this.budgetCategoriesList.innerHTML = '<p class="empty-message">No budget categories added yet</p>';
            return;
        }

        this.budgetCategoriesList.innerHTML = this.budgetCategories.map(category => {
            const spent = this.getCategorySpent(category.id);
            const balance = this.getCategoryBalance(category);
            const balanceClass = balance >= 0 ? 'surplus' : 'deficit';

            return `
                <div class="budget-category">
                    <div class="category-info">
                        <div class="category-header">
                            <span class="category-name">${this.escapeHtml(category.name)}</span>
                            <span class="category-budget">${this.formatCurrency(category.budget)}</span>
                        </div>
                        <div class="category-stats">
                            <span class="category-spent">Spent: ${this.formatCurrency(spent)}</span>
                            <span class="category-balance ${balanceClass}">
                                Balance: ${balance >= 0 ? '+' : '-'}${this.formatCurrency(Math.abs(balance))}
                            </span>
                        </div>
                    </div>
                    <button class="delete-btn" onclick="budgetTracker.deleteBudgetCategory(${category.id})">Delete</button>
                </div>
            `;
        }).join('');
    }

    updateCategorySelect() {
        const currentValue = this.itemCategorySelect.value;

        this.itemCategorySelect.innerHTML = '<option value="">Select category</option>' +
            this.budgetCategories.map(category =>
                `<option value="${category.id}">${this.escapeHtml(category.name)}</option>`
            ).join('');

        // Restore previous selection if still valid
        if (currentValue && this.budgetCategories.find(cat => cat.id === parseInt(currentValue))) {
            this.itemCategorySelect.value = currentValue;
        }
    }

    renderItems() {
        if (this.items.length === 0) {
            this.itemsList.innerHTML = '<p class="empty-message">No items added yet</p>';
            return;
        }

        this.itemsList.innerHTML = this.items.map(item => `
            <div class="item">
                <div class="item-info">
                    <div class="item-header">
                        <span class="item-name">${this.escapeHtml(item.name)}</span>
                        <span class="item-cost">${this.formatCurrency(item.cost)}</span>
                    </div>
                    <div class="item-category">Category: ${this.escapeHtml(this.getCategoryName(item.categoryId))}</div>
                </div>
                <button class="delete-btn" onclick="budgetTracker.deleteItem(${item.id})">Delete</button>
            </div>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveData() {
        const data = {
            budgetCategories: this.budgetCategories,
            items: this.items
        };
        localStorage.setItem('budgetTrackerData', JSON.stringify(data));
    }

    loadData() {
        const data = localStorage.getItem('budgetTrackerData');
        if (data) {
            const parsed = JSON.parse(data);
            this.budgetCategories = parsed.budgetCategories || [];
            this.items = parsed.items || [];
        }
    }
}

// Initialize the app
const budgetTracker = new BudgetTracker();
