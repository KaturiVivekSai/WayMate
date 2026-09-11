import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { Coins, ArrowUpRight, ArrowDownLeft, PlusCircle, Info, Sparkles, X, CheckCircle2 } from 'lucide-react';

export const WalletPage = () => {
  const { wallet, setActiveTab, addCredits, isSubmitting } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [modalError, setModalError] = useState('');

  const handleTopupSubmit = async (e) => {
    e.preventDefault();
    const amount = customAmount ? parseInt(customAmount, 10) : topupAmount;
    if (isNaN(amount) || amount <= 0) {
      setModalError('Please enter a valid credit amount greater than 0.');
      return;
    }
    try {
      setModalError('');
      await addCredits(amount);
      setIsModalOpen(false);
      setCustomAmount('');
    } catch (err) {
      setModalError(err.message || 'Could not add credits.');
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-verified">
            Community Credit Wallet
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            Peer-to-Peer Mobility Economy
          </span>
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)' }}>
          Community Credits
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Credits represent shared fuel and transportation contributions within the campus community.
        </p>
      </div>

      {/* Main Balance Hero Card */}
      <div className="card" style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--border-light)',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Available Community Balance
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '38px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '-1px' }}>
                {wallet.balance}
              </span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>
                Community Credits
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              Stored in Supabase database · Ready for campus rides
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <PlusCircle size={15} />
              <span>+ Add Credits</span>
            </button>
            <button
              onClick={() => setActiveTab('offer')}
              className="btn btn-secondary btn-sm"
            >
              Offer a ride to earn
            </button>
          </div>
        </div>

        {/* Monthly Delta Breakdown */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginTop: '20px',
          paddingTop: '18px',
          borderTop: '1px solid var(--border-light)'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ArrowDownLeft size={18} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Total Credits Earned / Added</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--success)' }}>
                +{wallet.thisMonthEarned} credits
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#FEF2F2',
              color: '#B91C1C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ArrowUpRight size={18} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Total Credits Contributed</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#B91C1C' }}>
                −{wallet.thisMonthUsed} credits
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Credits Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{
            maxWidth: '440px',
            width: '100%',
            padding: '24px',
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coins size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Add Community Credits</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px', lineHeight: 1.5 }}>
              Add Community Credits to your student wallet. Credits are tracked in Supabase and used to contribute towards shared campus journeys.
            </p>

            <form onSubmit={handleTopupSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>
                  Select Credit Pack
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {[25, 50, 100, 200].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => { setTopupAmount(amt); setCustomAmount(''); }}
                      className={`btn btn-sm ${topupAmount === amt && !customAmount ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontWeight: '700', padding: '8px 4px' }}
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>
                  Or enter custom credit amount
                </label>
                <div className="input-with-icon">
                  <Coins size={16} />
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={customAmount}
                    onChange={e => setCustomAmount(e.target.value)}
                    placeholder="e.g. 75"
                  />
                </div>
              </div>

              {modalError && (
                <div className="auth-error" style={{ marginBottom: '14px', fontSize: '12px' }}>
                  {modalError}
                </div>
              )}

              <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '10px 12px', marginBottom: '18px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <Sparkles size={13} style={{ display: 'inline', marginRight: 4, color: 'var(--primary)' }} />
                Instant top-up will be saved to Supabase <code>credit_transactions</code> table.
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary btn-block"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-block"
                >
                  {isSubmitting ? 'Adding…' : `Add ${customAmount || topupAmount} Credits`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Philosophy Callout: How credits work */}
      <div style={{
        backgroundColor: 'var(--primary-light)',
        border: '1px solid var(--primary-border)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: 'var(--primary)', marginBottom: '6px' }}>
          <Info size={16} />
          <span>How Community Credits Flow</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <div>
            <strong style={{ color: 'var(--primary)' }}>When you offer a ride:</strong>
            <div>Receive Community Credits from passenger for shared journey fuel contribution.</div>
          </div>
          <div>
            <strong style={{ color: 'var(--text-main)' }}>When you take a ride:</strong>
            <div>Community Credits are deducted from your balance to cover the shared seat.</div>
          </div>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>
            Recent Credit Activity (Supabase)
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            {wallet.transactions?.length || 0} transactions
          </span>
        </div>

        {/* Empty State */}
        {(!wallet.transactions || wallet.transactions.length === 0) ? (
          <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <Coins size={24} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>
              Your wallet is ready
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Share your first ride or reserve a seat to start earning and using Community Credits.
            </p>
            <button
              onClick={() => setActiveTab('offer')}
              className="btn btn-primary btn-sm"
            >
              Offer a ride
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {wallet.transactions.map(tx => {
              const isPositive = tx.isPositive || tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className="card"
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: isPositive ? 'var(--success-bg)' : 'var(--bg-subtle)',
                      color: isPositive ? 'var(--success)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isPositive ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>

                    <div>
                      <div className="text-break" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>
                        {tx.title || tx.description}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        {tx.timestamp}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    fontSize: '15px',
                    fontWeight: '800',
                    color: isPositive ? 'var(--success)' : 'var(--text-main)',
                    flexShrink: 0
                  }}>
                    {isPositive ? `+${tx.amount}` : `−${tx.amount}`} Credits
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
