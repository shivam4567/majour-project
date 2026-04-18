1. INSTALL SHADCN UI

2. User Authentication
   -->clerk for authentication

3. Database and Backend
   -->Supabase
   -->What is supabase?
   -->What is prisma and postgresql

4. Security
   -->Arcjet

5. Drag and Drop Search
   -->npm i react-dropzone

6. Create Models
   -->Create models using Prisma

7. Server Actions
   -->To make Api calls to the database.

8. Rate Limiting
   -->arcjet package
   -->allow user to make only 10 reqs

FUNCTIONALITIES

1. Filters(cartype,model,fuelType etc)
2. Wishlist (saved cars feature)
3. AI Search car (drag and drop image and get all details if it is in DB)
4. Car Details
5. Car Preview feature (when u share link with someone, they can preview car name and image)
6. Share the car details (whatsapp,fb,etc)
7. Emi calculator
8. Car Test drive booking and reserve car
9. Admin can see statisctic

//REDIRECT CAN ONLY BE USED IN SERVER COMPONENTS
redirect('/sign-in?redirect=/reservations')

//FOR CLIENT COMPONENTS, USE USEROUTER HOOK
router.push('/sign-in?redirect=/reservations');
