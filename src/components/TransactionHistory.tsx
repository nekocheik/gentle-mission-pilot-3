import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Transaction } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fr } from 'date-fns/locale';
import { Wallet, TrendingUp, TrendingDown, ShoppingCart } from 'lucide-react';

export const TransactionHistory = () => {
  const { transactions, fetchTransactions, userPoints } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadTransactions = async () => {
      await fetchTransactions();
      setIsLoading(false);
    };
    
    loadTransactions();
  }, [fetchTransactions]);
  
  const getTransactionTypeIcon = (transaction: Transaction) => {
    if (transaction.type === 'reward') {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (transaction.type === 'penalty') {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    } else {
      return <ShoppingCart className="w-4 h-4 text-orange-500" />;
    }
  };
  
  const getTransactionColor = (transaction: Transaction) => {
    if (transaction.amount > 0) {
      return 'text-green-600';
    } else {
      return 'text-red-600';
    }
  };
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy à HH:mm', { locale: fr });
  };
  
  const rewards = transactions.filter(t => t.type === 'reward');
  const penalties = transactions.filter(t => t.type === 'penalty');
  const purchases = transactions.filter(t => t.type === 'purchase');
  
  return (
    <Card className="w-full h-full overflow-hidden">
      <CardHeader className="bg-background border-b">
        <div className="flex justify-between items-center">
          <CardTitle>Historique des transactions</CardTitle>
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Wallet className="w-5 h-5" />
            <span>{userPoints.toFixed(2)}€</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full p-0 rounded-none">
            <TabsTrigger value="all" className="flex-1 py-3 rounded-none">Toutes</TabsTrigger>
            <TabsTrigger value="rewards" className="flex-1 py-3 rounded-none">Récompenses</TabsTrigger>
            <TabsTrigger value="penalties" className="flex-1 py-3 rounded-none">Pénalités</TabsTrigger>
            <TabsTrigger value="purchases" className="flex-1 py-3 rounded-none">Achats</TabsTrigger>
          </TabsList>
          
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">
              Chargement des transactions...
            </div>
          ) : (
            <>
              <TabsContent value="all" className="mt-0">
                {transactions.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    Aucune transaction à afficher
                  </div>
                ) : (
                  <div className="divide-y">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="p-4">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            {getTransactionTypeIcon(transaction)}
                            <span className="font-medium">{transaction.description}</span>
                          </div>
                          <span className={`font-semibold ${getTransactionColor(transaction)}`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)}€
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(transaction.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="rewards" className="mt-0">
                {rewards.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    Aucune récompense à afficher
                  </div>
                ) : (
                  <div className="divide-y">
                    {rewards.map((transaction) => (
                      <div key={transaction.id} className="p-4">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="font-medium">{transaction.description}</span>
                          </div>
                          <span className="font-semibold text-green-600">
                            +{transaction.amount.toFixed(2)}€
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(transaction.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="penalties" className="mt-0">
                {penalties.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    Aucune pénalité à afficher
                  </div>
                ) : (
                  <div className="divide-y">
                    {penalties.map((transaction) => (
                      <div key={transaction.id} className="p-4">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-red-500" />
                            <span className="font-medium">{transaction.description}</span>
                          </div>
                          <span className="font-semibold text-red-600">
                            {transaction.amount.toFixed(2)}€
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(transaction.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="purchases" className="mt-0">
                {purchases.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">
                    Aucun achat à afficher
                  </div>
                ) : (
                  <div className="divide-y">
                    {purchases.map((transaction) => (
                      <div key={transaction.id} className="p-4">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-orange-500" />
                            <span className="font-medium">{transaction.description}</span>
                          </div>
                          <span className="font-semibold text-red-600">
                            {transaction.amount.toFixed(2)}€
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(transaction.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};
