const express = require('express');

const Product = require('../models/product');
const Variant = require('../models/variant');

const router = express.Router();

//Create a new product (json)
router.post('/', async(req, res)=> {
    try{
        const{ name, description, price, variants } = req.body;

        const productTemp = new Product({
            name,
            description,
            price,
            variants: []
        });

        if(variants && variants.length > 0){
            for(const variantData of variants){
                const variantTemp = new Variant({
                    name: variantData.name,
                    SKU: variantData.SKU,
                    additionalCost: variantData.additionalCost || 0,
                    stock: variantData.stock || 0
                });
                productTemp.variants.push(variantTemp);
                await variantTemp.save();
            }
        }

        await productTemp.save();
        res.status(201).json(productTemp);
    }
    catch(err){
        res.status(500).json({ message: err.message });
    }   

});

// Get all products
router.get('/', async (req, res) => {
    try {
      const products = await Product.find().populate('variants');
      res.json(products);
    } 
    catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  
  // Update a product
  router.put('/:id', async (req, res) => {
    try {
      const productId = req.params.id;
      const { name, description, price, variants } = req.body;
  
      const product = await Product.findById(productId);
  
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      product.name = name;
      product.description = description;
      product.price = price;
  
      // Update variants or create new ones if provided
      if (variants && variants.length > 0) {
        const updatedVariants = [];
  
        for (const variantData of variants) {
          let variant;
  
          if (variantData._id) {
            // If the variant has an _id, update the existing variant
            variant = await Variant.findByIdAndUpdate(variantData._id, variantData, { new: true });
          } else {
            // Otherwise, create a new variant
            variant = new Variant({
              name: variantData.name,
              SKU: variantData.SKU,
              additionalCost: variantData.additionalCost || 0,
              stockCount: variantData.stockCount || 0,
            });
            await variant.save();
          }
  
          updatedVariants.push(variant._id);
        }
  
        product.variants = updatedVariants;
      }
  
      await product.save();
      res.json(product);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Delete a product
  router.delete('/:id', async (req, res) => {
    try {
      const productId = req.params.id;
  
      // Delete the product and its associated variants
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      await Variant.deleteMany({ _id: { $in: product.variants } });
      await Product.deleteOne({ _id: productId });
  
      res.json({ message: 'Product deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Read a variant
  router.get('/variants/:id', async (req, res) => {
    try {
      const variantId = req.params.id;
      const variant = await Variant.findById(variantId);
  
      if (!variant) {
        return res.status(404).json({ message: 'Variant not found' });
      }
  
      res.json(variant);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Update a variant
  router.put('/variants/:id', async (req, res) => {
    try {
      const variantId = req.params.id;
      const variantData = req.body;
  
      const variant = await Variant.findByIdAndUpdate(variantId, variantData, { new: true });
  
      if (!variant) {
        return res.status(404).json({ message: 'Variant not found' });
      }
  
      res.json(variant);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Delete a variant
  router.delete('/variants/:id', async (req, res) => {
    try {
      const variantId = req.params.id;
  
      const variant = await Variant.findById(variantId);
      if (!variant) {
        return res.status(404).json({ message: 'Variant not found' });
      }
  
      const product = await Product.findOneAndUpdate(
        { variants: variantId },
        { $pull: { variants: variantId } },
        { new: true }
      );
  
      // Now, delete the variant from the database
      await Variant.findByIdAndDelete(variantId);
  
      res.json({ message: 'Variant deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  
module.exports = router;
  
