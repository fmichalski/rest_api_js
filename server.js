const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();

mongoose.connect('mongodb://localhost:27017/warehouse', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Could not connect to MongoDB', err);
});

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

const Product = require('./model/products');

// Endpoint GET zwracający wszystkie produkty z możliwością filtrowania i sortowania
app.get('/products', async (req, res) => {
  try {
    let query = Product.find();
    
    // Filtrowanie produktów
    if (req.query.name) {
      query = query.where('name').equals(req.query.name);
    }
    if (req.query.price) {
      query = query.where('price').equals(req.query.price);
    }
    if (req.query.quantity) {
      query = query.where('quantity').equals(req.query.quantity);
    }

    // Sortowanie produktów
    if (req.query.sortBy) {
      query = query.sort(req.query.sortBy);
    }

    const products = await query.exec();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Endpoint POST do dodawania nowego produktu
app.post('/products', async (req, res) => {
  const product = new Product({
    name: req.body.name,
    price: req.body.price,
    description: req.body.description,
    quantity: req.body.quantity,
    unit: req.body.unit
  });

  try {
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Endpoint PUT do edycji istniejącego produktu
app.put('/products/:id', async (req, res) => {
  const productId = req.params.id;

  try {
    const product = await Product.findByIdAndUpdate(productId, req.body, { new: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Endpoint DELETE do usuwania produktu
app.delete('/products/:id', async (req, res) => {
  const productId = req.params.id;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.quantity > 0) {
      return res.status(400).json({ message: 'Product still in stock' });
    }
    await Product.findByIdAndDelete(productId);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Endpoint GET do raportowania stanu magazynu
app.get('/warehouse-report', async (req, res) => {
  try {
    const report = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$price', '$quantity'] } }
        }
      }
    ]);
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});