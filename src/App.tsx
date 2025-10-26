import { useState, useEffect } from 'react';
import { AuthPage } from './components/AuthPage';
import { Header } from './components/Header';
import { ProductsPage } from './components/ProductsPage';
import { ProductDetailModal } from './components/ProductDetailModal';
import { UploadProductPage } from './components/UploadProductPage';
import { ProfilePage } from './components/ProfilePage';
import { MessagesPage } from './components/MessagesPage';
import { Toaster, toast } from './components/ui/sonner'; // Import 'toast' for notifications
import { apiCall } from './utils/api';
import { createClient } from './utils/supabase/client';

// 1. UPDATE INTERFACE: Add the 'status' field
interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  condition: string;
  imageUrl?: string;
  sellerName: string;
  sellerId: string;
  sellerEmail: string;
  createdAt: string;
  status: 'available' | 'sold'; // Add status field
}

type View = 'products' | 'messages' | 'profile' | 'upload';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentView, setCurrentView] = useState<View>('products');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isUserVerified, setIsUserVerified] = useState(false);
  // Add state to trigger a refresh of the product listings
  const [productUpdateKey, setProductUpdateKey] = useState(0); 

  const supabase = createClient();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        localStorage.setItem('access_token', session.access_token);
        localStorage.setItem('user_id', session.user.id);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setCurrentView('products');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('products');
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleContactSeller = async (product: Product) => {
    // Switch to messages view and initiate conversation
    setCurrentView('messages');
    
    // Send initial message to create conversation
    try {
      await apiCall('/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          receiverId: product.sellerId,
          message: `Hi! I'm interested in your ${product.title}`,
        }),
      });
    } catch (error) {
      console.error('Error initiating conversation:', error);
    }
  };

  const handleProductCreated = () => {
    setCurrentView('products');
    setProductUpdateKey(prev => prev + 1); // Trigger refresh
  };
  
  // New function to handle product status updates (like 'sold')
  const handleProductUpdate = (updatedProduct: Product) => {
    // 1. Update the currently selected product in the modal
    if (selectedProduct && selectedProduct.id === updatedProduct.id) {
      setSelectedProduct(updatedProduct);
    }
    // 2. Trigger a full product listing refresh
    setProductUpdateKey(prev => prev + 1);
  }

  // 2. NEW FUNCTION: Logic for marking an item as sold
  const handleMarkAsSold = async (productId: string) => {
    if (!isAuthenticated) return toast.error("You must be logged in to update a product.");

    try {
      // Call the backend API to change the product status to 'sold'
      const response = await apiCall(`/products/${productId}/status`, {
        method: 'PATCH', // PATCH is best practice for updating a single field
        body: JSON.stringify({ status: 'sold' }),
      });
      
      const updatedProduct: Product = await response.json();

      // Update local state and trigger refresh
      handleProductUpdate(updatedProduct);
      toast.success(`Product "${updatedProduct.title}" marked as SOLD!`);
      
    } catch (error) {
      console.error('Error marking product as sold:', error);
      toast.error("Failed to mark item as sold. Please try again.");
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#FF6B35' }}>
            <span className="text-2xl">🛒</span>
          </div>
          <p className="text-muted-foreground">Loading CampusKart...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <AuthPage onAuthSuccess={handleAuthSuccess} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFF5F0' }}>
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={handleLogout}
      />
      
      <main className="min-h-[calc(100vh-64px)]">
        {currentView === 'products' && (
          // 3. Pass the key to force ProductsPage to refetch data on update
          <ProductsPage 
            key={productUpdateKey} 
            onProductClick={handleProductClick} 
          />
        )}
        
        {currentView === 'messages' && <MessagesPage />}
        
        {currentView === 'profile' && (
          <ProfilePage onVerificationChange={setIsUserVerified} />
        )}
        
        {currentView === 'upload' && (
          <UploadProductPage
            onProductCreated={handleProductCreated}
            userVerified={isUserVerified}
          />
        )}
      </main>

      <ProductDetailModal
        product={selectedProduct}
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onContactSeller={handleContactSeller}
        // 4. Pass the new function to the modal
        onMarkAsSold={handleMarkAsSold} 
      />

      <Toaster />
    </div>
  );
}
