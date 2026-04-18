import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Button } from './ui/button'
import { ArrowLeft, CarFront, Heart, Layout, Plus } from 'lucide-react'
import { checkUser } from '@/lib/checkUser'
import ThemeToggle from './ThemeToggle'


const Header = async ({ isAdminPage = false }) => {
  //GET USER DETAILS
  const user = await checkUser();
  const isAdmin = user?.role=='ADMIN';
  return (
    <header className='fixed top-0 w-full bg-background/80 text-foreground backdrop-blur-md backdrop-saturate-150 z-50 border-b border-border'>
      <nav className='mx-auto px-4 py-4 flex items-center justify-between'>
        <Link href={isAdminPage ? "/admin" : "/"} className="flex items-center">
          <Image
            className='h-12 w-auto object-contain block dark:hidden'
            src={'/logo.png'}
            alt='logo'
            width={200}
            height={60}
            priority
          />
          <Image
            className='h-12 w-auto object-contain hidden dark:block'
            src={'/logo-white.png'}
            alt='logo'
            width={200}
            height={60}
            priority
          />
          {/* {isAdminPage && (
            <span className='text-xs font-extralight'>admin</span>
          )} */}
        </Link>

        <div className='flex items-center space-x-4'>
          <ThemeToggle />
          {isAdminPage ? <Link href={'/'}>
            <Button className={'flex items-center gap-2'} variant={'outline'}>
              <ArrowLeft size={18} />
              <span>Back to App</span>
            </Button>
          </Link> : <SignedIn>
            {/* Add Car button - visible to all signed-in users */}
            <Link href={isAdmin ? '/admin/cars/create' : '/cars/add'}>
              <Button variant={'outline'} className={'flex items-center gap-2'}>
                <Plus size={18} />
                <span className='hidden md:inline'>Add Car</span>
              </Button>
            </Link>

            <Link href={'/saved-cars'}>
              <Button>
                <Heart size={18} />
                <span className='hidden md:inline'>Saved Cars</span>
              </Button>
            </Link>


            {!isAdmin ? <Link href={'/reservations'}>
              <Button variant={'outline'}>
                <CarFront size={18} />
                <span className='hidden md:inline'>My Reservations</span>
              </Button>
            </Link> :

              <Link href={'/admin'}>
                <Button variant={'outline'}>
                  <Layout size={18} />
                  <span className='hidden md:inline'>Admin Portal</span>
                </Button>
              </Link>}
          </SignedIn>}

          <SignedOut>
            <SignInButton forceRedirectUrl='/'>
              <Button variant={'outline'}>Login</Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <UserButton appearance={{
              elements:{
                avatarBox: 'w-10 h-10'
              }
            }} />
          </SignedIn>
        </div>
      </nav>
    </header>
  )
}

export default Header
