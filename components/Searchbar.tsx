"use client";

import { scrapeAndStoreProduct } from "@/lib/actions";
import { FormEvent, useState } from "react";
import { toast } from "react-hot-toast";

const Searchbar = () => {
   const [searchPrompt, setSearchPrompt] = useState("");
   const [isLoading, setIsLoading] = useState(false);

   const isValidAmazonProductUrl = (url: string) => {
      try {
         const parsedUrl = new URL(url);
         const hostname = parsedUrl.hostname;

         if (
            hostname.includes("amazon.com") ||
            hostname.includes("amazon.") ||
            hostname.endsWith("amazon")
         ) {
            return true;
         }
      } catch (error) {
         return false;
      }

      return false;
   };

   const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const isValidLink = isValidAmazonProductUrl(searchPrompt);

      if (!isValidLink) {
         return toast.error("Please provide a valid Amazon link");
      }

      try {
         setIsLoading(true);

         //scrape the product page
         const product = await scrapeAndStoreProduct(searchPrompt);
      } catch (error) {
         console.log(error)
      } finally {
         setIsLoading(false);
      }
   };

   return (
      <form className="flex flex-wrap gap-4 mt-12" onSubmit={handleSubmit}>
         <input
            type="text"
            value={searchPrompt}
            onChange={(e) => setSearchPrompt(e.target.value)}
            placeholder="Enter product input"
            className="searchbar-input"
         />
         <button
            type="submit"
            className="searchbar-btn"
            disabled={searchPrompt === "" || isLoading}
         >
            {isLoading ? "Searching..." : "Search"}
         </button>
      </form>
   );
};

export default Searchbar;
