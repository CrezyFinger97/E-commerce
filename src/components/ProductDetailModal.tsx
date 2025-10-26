import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { MapPin, DollarSign, Tag, Calendar, User } from 'lucide-react';

// Define the interface for the product, including the 'status'
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
  status: 'available' | 'sold';
}

// Define the component's props, including the new onMarkAsSold function
interface ProductDetailModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onContactSeller: (product: Product) => void;
  // NEW PROP: Function passed from App.tsx to handle the sold logic
  onMarkAsSold: (productId: string) => void; 
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  open,
  onClose,
  onContactSeller,
  onMarkAsSold, // Destructure the new function
}) => {
  if (!product) return null;

  // Get the current logged-in user's ID from localStorage
  const currentUserId = localStorage.getItem('user_id');

  // Logic to determine if the 'Mark as Sold' button should be shown
  const isSeller = product.sellerId === currentUserId;
  const isAvailable = product.status === 'available';

  // Format the date for display
  const listedDate = new Date(product.createdAt).toLocaleDateString();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] md:max-w-3xl p-0">
        <div className="flex flex-col md:flex-row">
          
          {/* Product Image Section */}
          <div className="md:w-1/2 p-4 flex items-center justify-center bg-gray-50">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-auto max-h-[400px] object-contain rounded-lg shadow-md"
              />
            ) : (
              <div className="w-full h-[400px] flex items-center justify-center text-gray-500 border border-dashed rounded-lg">
                No Image Provided
              </div>
            )}
          </div>

          {/* Product Details Section */}
          <div className="md:w-1/2 p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-3xl font-bold">{product.title}</DialogTitle>
            </DialogHeader>

            {/* Price and Status */}
            <div className="mb-6 flex items-baseline justify-between">
              <p className="text-4xl font-extrabold" style={{ color: '#FF6B35' }}>
                <DollarSign className="inline w-6 h-6 mr-1" />{product.price.toFixed(2)}
              </p>
              
              {/* STATUS BADGE */}
              {product.status === 'sold' ? (
                <span className="bg-red-500 text-white text-sm font-semibold px-3 py-1 rounded-full uppercase">
                  Sold
                </span>
              ) : (
                <span className="bg-green-500 text-white text-sm font-semibold px-3 py-1 rounded-full uppercase">
                  Available
                </span>
              )}
            </div>

            {/* Description */}
            <DialogDescription className="text-gray-700 mb-6">
              {product.description || 'No description provided.'}
            </DialogDescription>

            {/* Item Attributes */}
            <div className="space-y-3 text-sm text-gray-600 mb-8">
              <div className="flex items-center">
                <Tag className="w-4 h-4 mr-2 text-blue-500" /> Condition: <span className="font-medium ml-1">{product.condition}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-purple-500" /> Listed on: <span className="font-medium ml-1">{listedDate}</span>
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2 text-orange-500" /> Seller: <span className="font-medium ml-1">{product.sellerName}</span>
              </div>
            </div>

            {/* Action Button: Mark as Sold OR Contact Seller */}
            <div className="flex flex-col space-y-3">
              {isSeller && isAvailable ? (
                // 1. MARK AS SOLD BUTTON (Visible only to the seller and if available)
                <Button 
                  onClick={() => onMarkAsSold(product.id)}
                  className="w-full text-lg py-6"
                  style={{ backgroundColor: '#28a745' }}
                >
                  ✅ Mark as Sold
                </Button>
              ) : (
                // 2. CONTACT SELLER BUTTON (Visible to everyone else)
                <Button 
                  onClick={() => onContactSeller(product)}
                  disabled={product.status === 'sold'} // Disable if already sold
                  className="w-full text-lg py-6"
                  style={{ backgroundColor: '#FF6B35' }}
                >
                  {product.status === 'sold' ? 'SOLD' : '✉️ Contact Seller'}
                </Button>
              )}

              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
            
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
