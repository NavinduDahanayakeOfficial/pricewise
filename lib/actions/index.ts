"use server";

import { revalidatePath } from "next/cache";
import Product from "../models/product.model";
import { connectToDB } from "../mongoose";
import { scrapeAmazonProduct } from "../scraper";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utils";

export async function scrapeAndStoreProduct(productUrl: string) {
   let isExistingProduct = false;

   if (!productUrl) return { isSuccess: false, isExistingProduct };

   try {
      connectToDB();
      const scrapedProduct = await scrapeAmazonProduct(productUrl);

      if (!scrapedProduct) return;

      let product = scrapedProduct;

      const existingProduct = await Product.findOne({
         url: scrapedProduct.url,
      });

      if (existingProduct) {
         isExistingProduct = true;
         if (
            existingProduct.priceHistory[
               existingProduct.priceHistory.length - 1
            ].price === scrapedProduct.currentPrice
         ) {
            return { isSuccess: false, isExistingProduct };
         }

         const updatedPriceHistory: any = [
            ...existingProduct.priceHistory,
            { price: scrapedProduct.currentPrice },
         ];

         product = {
            ...scrapedProduct,
            priceHistory: updatedPriceHistory,
            lowestPrice: getLowestPrice(updatedPriceHistory),
            highestPrice: getHighestPrice(updatedPriceHistory),
            averagePrice: getAveragePrice(updatedPriceHistory),
         };
      }

      const newProduct = await Product.findOneAndUpdate(
         {
            url: scrapedProduct.url,
         },
         { $set: product },
         { upsert: true, new: true }
      );

      revalidatePath(`/products/${newProduct._id}`);
      return { isSuccess: true, isExistingProduct };
   } catch (error: any) {
      throw new Error(`Failed to create/update product: ${error.message}`);
   }
}



export async function getProductById(productId: string) {
   try {
      connectToDB();

      const product = await Product.findOne({ _id: productId });

      if (!product) return null;

      return product;
   } catch (error) {
      console.log(error);
   }
}

export async function getAllProducts() {
   try {
      connectToDB();

      const products = await Product.find();

      if (!products) return null;

      return products;
   } catch (error) {
      console.log(error);
   }
}

export async function getSimilarProducts(productId: string) {
   try {
      connectToDB();

      const products = await Product.findById(productId);

      if (!products) return null;

      const similarProduct = await Product.find({
         _id: { $ne: productId },
      }).limit(3);

      return similarProduct;
   } catch (error) {
      console.log(error);
   }
}
