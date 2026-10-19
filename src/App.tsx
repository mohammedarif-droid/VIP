/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { StorageManager } from './engine/storageManager';
import {
  Customer,
  MonthlyBalance,
  MonthlyTransaction,
  CustomerEconomics,
  CustomerProduct,
  RelationshipActivity,
  Campaign,
  MethodologyConfig,
  Currency,
  DimensionScores,
  ActionPriorityScore,
  CustomerForecast,
} from './types/banking';
import {
  computeDimensionScores,
  determineStrategicTier,
  calculateActionPriority,
  generateCustomerForecast,
} from './engine/deterministicMath';
import { Header } from './components/Header';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { CustomerIntelligenceList } from './components/CustomerIntelligenceList';
import { ForecastingEngineView } from './components/ForecastingEngineView';
import { PrioritizationMatrixView } from './components/PrioritizationMatrixView';
import { ComparisonLab } from './components/ComparisonLab';
import { DataImportWizard } from './components/DataImportWizard';
import { GovernanceAndAudit } from './components/GovernanceAndAudit';
import { BuiltInUserManual } from './components/BuiltInUserManual';
import { ProcurementTrackerView } from './components/ProcurementTrackerView';
import { exportComprehensiveExcel, exportExecutivePDF } from './utils/exportEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Core Data State
  const [customers, setCustomers] = useState<Customer[]>(() => StorageManager.getCustomers());
  const [balances, setBalances] = useState<MonthlyBalance[]>(() => StorageManager.getBalances());
  const [transactions, setTransactions] = useState<MonthlyTransaction[]>(() => StorageManager.getTransactions());
  const [economics, setEconomics] = useState<CustomerEconomics[]>(() => StorageManager.getEconomics());
  const [products, setProducts] = useState<CustomerProduct[]>(() => StorageManager.getProducts());
  const [activities, setActivities] = useState<RelationshipActivity[]>(() => StorageManager.getActivities());
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => StorageManager.getCampaigns());
  const [methodology, setMethodology] = useState<MethodologyConfig>(() => StorageManager.getMethodology());
  const [auditLogs, setAuditLogs] = useState(() => StorageManager.getAuditLogs());

  // Deterministic Calculation Engine
  const { scoresMap, prioritiesMap, forecastsMap, urgentAlertsCount } = useMemo(() => {
    // 1. Prepare Peer Distributions for Percentile Ranks
    const peerAverageBalances: number[] = [];
    const peerNetContributions: number[] = [];
    const peerTransactionVolumes: number[] = [];

    customers.forEach((c) => {
      const cBalances = balances.filter((b) => b.customerId === c.id);
      if (cBalances.length > 0) {
        const recent = cBalances.slice(-3);
        const avg = recent.reduce((sum, b) => sum + b.averageBalance, 0) / recent.length;
        peerAverageBalances.push(avg);
      }

      const cEcon = economics.find((e) => e.customerId === c.id);
      if (cEcon && cEcon.isAvailable) {
        peerNetContributions.push(cEcon.netContribution);
      }

      const cTrans = transactions.filter((t) => t.customerId === c.id);
      const totalFees = cTrans.reduce((sum, t) => sum + (t.feeRevenue || 0), 0);
      if (totalFees > 0) {
        peerTransactionVolumes.push(totalFees);
      }
    });

    const sMap: Record<string, DimensionScores> = {};
    const pMap: Record<string, ActionPriorityScore> = {};
    const fMap: Record<string, CustomerForecast> = {};

    customers.forEach((c) => {
      const cBalances = balances.filter((b) => b.customerId === c.id);
      const cTrans = transactions.filter((t) => t.customerId === c.id);
      const cEcon = economics.find((e) => e.customerId === c.id);
      const cProds = products.filter((p) => p.customerId === c.id);
      const cActs = activities.filter((a) => a.customerId === c.id);

      // Compute 4 Dimension Scores (A, G, R, E)
      const scores = computeDimensionScores(
        {
          customer: c,
          balances: cBalances,
          transactions: cTrans,
          economics: cEcon,
          products: cProds,
          activities: cActs,
          peerAverageBalances,
          peerNetContributions,
          peerTransactionVolumes,
        },
        methodology
      );
      sMap[c.id] = scores;

      // Determine Strategic Tier
      const tierResult = determineStrategicTier(scores, methodology);
      c.currentTier = tierResult.tier;

      // Compute Action Priority
      const priority = calculateActionPriority(c, scores, cActs, cProds, methodology);
      pMap[c.id] = priority;

      // Compute Rolling-Origin Forecast
      const forecast = generateCustomerForecast(c.id, cBalances, currency);
      fMap[c.id] = forecast;
    });

    const urgentCount = activities.filter(
      (a) => a.isUrgentComplaint && a.resultStatus !== 'resolved'
    ).length;

    return {
      scoresMap: sMap,
      prioritiesMap: pMap,
      forecastsMap: fMap,
      urgentAlertsCount: urgentCount,
    };
  }, [customers, balances, transactions, economics, products, activities, methodology, currency]);

  // Handlers
  const handleExportExcel = () => {
    exportComprehensiveExcel({
      customers,
      scoresMap,
      prioritiesMap,
      forecastsMap,
      campaigns,
      auditLogs,
      methodology,
    });
    StorageManager.logAudit('EXPORT', 'تصدير تقرير إكسل تنفيذي شامل متعدد المصنفات');
    setAuditLogs(StorageManager.getAuditLogs());
  };

  const handleExportPDF = () => {
    exportExecutivePDF({
      customers,
      scoresMap,
      prioritiesMap,
      forecastsMap,
      campaigns,
      auditLogs,
      methodology,
    });
    StorageManager.logAudit('EXPORT', 'تصدير تقرير تنفيذي رسمي بصيغة PDF');
    setAuditLogs(StorageManager.getAuditLogs());
  };

  const handleResetBenchmark = () => {
    StorageManager.resetToBenchmark();
    setCustomers(StorageManager.getCustomers());
    setBalances(StorageManager.getBalances());
    setTransactions(StorageManager.getTransactions());
    setEconomics(StorageManager.getEconomics());
    setProducts(StorageManager.getProducts());
    setActivities(StorageManager.getActivities());
    setCampaigns(StorageManager.getCampaigns());
    setMethodology(StorageManager.getMethodology());
    setAuditLogs(StorageManager.getAuditLogs());
  };

  const handleUpdateMethodology = (newConfig: MethodologyConfig) => {
    StorageManager.saveMethodology(newConfig, true);
    setMethodology(newConfig);
    setAuditLogs(StorageManager.getAuditLogs());
  };

  const handleAddSingleCustomer = (newCustomer: Customer) => {
    const updated = [newCustomer, ...customers];
    StorageManager.saveCustomers(updated, true);
    setCustomers(updated);
    setAuditLogs(StorageManager.getAuditLogs());
  };

  const handleImportCustomers = (imported: Customer[]) => {
    // Merge or replace
    const existingMap = new Map(customers.map((c) => [c.sourceCode, c]));
    imported.forEach((inc) => existingMap.set(inc.sourceCode, inc));
    const merged = Array.from(existingMap.values());

    StorageManager.saveCustomers(merged, true);
    setCustomers(merged);
    setAuditLogs(StorageManager.getAuditLogs());
    setActiveTab('clients');
  };

  const handleImportBalances = (imported: MonthlyBalance[]) => {
    const merged = [...balances, ...imported];
    StorageManager.saveBalances(merged);
    setBalances(merged);
    StorageManager.logAudit('IMPORT', `تم استيراد ${imported.length} سجل أرصدة شهرية`);
    setAuditLogs(StorageManager.getAuditLogs());
    setActiveTab('clients');
  };

  const handleAddActivity = (newActivity: RelationshipActivity) => {
    const updated = [newActivity, ...activities];
    StorageManager.saveActivities(updated);
    setActivities(updated);
    StorageManager.logAudit('ACTIVITY_CREATE', `تسجيل تفاعل/زيارة جديدة: ${newActivity.goal}`);
    setAuditLogs(StorageManager.getAuditLogs());
  };

  const handleAddCampaign = (newCamp: Campaign) => {
    const updated = [newCamp, ...campaigns];
    StorageManager.saveCampaigns(updated);
    setCampaigns(updated);
    StorageManager.logAudit('ACTIVITY_CREATE', `اعتماد مبادرة جديدة: ${newCamp.title}`);
    setAuditLogs(StorageManager.getAuditLogs());
  };

  const handleRestoreBackup = (jsonContent: string): boolean => {
    const success = StorageManager.restoreFullBackupJSON(jsonContent);
    if (success) {
      setCustomers(StorageManager.getCustomers());
      setBalances(StorageManager.getBalances());
      setTransactions(StorageManager.getTransactions());
      setEconomics(StorageManager.getEconomics());
      setProducts(StorageManager.getProducts());
      setActivities(StorageManager.getActivities());
      setCampaigns(StorageManager.getCampaigns());
      setMethodology(StorageManager.getMethodology());
      setAuditLogs(StorageManager.getAuditLogs());
    }
    return success;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif]">
      {/* Top Banking Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={setCurrency}
        methodology={methodology}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
        onResetBenchmark={handleResetBenchmark}
        urgentAlertsCount={urgentAlertsCount}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'dashboard' && (
          <ExecutiveDashboard
            customers={customers}
            scoresMap={scoresMap}
            prioritiesMap={prioritiesMap}
            activities={activities}
            campaigns={campaigns}
            currency={currency}
            onSelectCustomer={(id) => {
              setSelectedCustomerId(id);
              setActiveTab('clients');
            }}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'clients' && (
          <CustomerIntelligenceList
            customers={customers}
            scoresMap={scoresMap}
            prioritiesMap={prioritiesMap}
            balances={balances}
            transactions={transactions}
            products={products}
            activities={activities}
            currency={currency}
            selectedCustomerId={selectedCustomerId}
            onSelectCustomer={setSelectedCustomerId}
            onAddActivity={handleAddActivity}
            onOpenProcurement={() => setActiveTab('procurement')}
          />
        )}

        {activeTab === 'procurement' && (
          <ProcurementTrackerView
            onBackToClients={() => {
              setSelectedCustomerId('cust-001');
              setActiveTab('clients');
            }}
          />
        )}

        {activeTab === 'forecast' && (
          <ForecastingEngineView
            customers={customers}
            balances={balances}
            currency={currency}
            selectedCustomerId={selectedCustomerId}
            onSelectCustomer={setSelectedCustomerId}
          />
        )}

        {activeTab === 'priorities' && (
          <PrioritizationMatrixView
            customers={customers}
            prioritiesMap={prioritiesMap}
            scoresMap={scoresMap}
            activities={activities}
            campaigns={campaigns}
            currency={currency}
            onSelectCustomer={(id) => {
              setSelectedCustomerId(id);
              setActiveTab('clients');
            }}
            onAddCampaign={handleAddCampaign}
          />
        )}

        {activeTab === 'comparison' && (
          <ComparisonLab
            customers={customers}
            scoresMap={scoresMap}
            prioritiesMap={prioritiesMap}
            balances={balances}
            products={products}
            activities={activities}
            currency={currency}
            onSelectCustomer={(id) => {
              setSelectedCustomerId(id);
              setActiveTab('clients');
            }}
          />
        )}

        {activeTab === 'import' && (
          <DataImportWizard
            existingCustomers={customers}
            onImportCustomers={handleImportCustomers}
            onImportBalances={handleImportBalances}
            onAddSingleCustomer={handleAddSingleCustomer}
          />
        )}

        {activeTab === 'governance' && (
          <GovernanceAndAudit
            methodology={methodology}
            onUpdateMethodology={handleUpdateMethodology}
            auditLogs={auditLogs}
            onResetBenchmark={handleResetBenchmark}
            onRestoreBackup={handleRestoreBackup}
          />
        )}

        {activeTab === 'manual' && <BuiltInUserManual />}
      </main>

      {/* Banking Confidentiality Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>
            منصة ذكاء وتقييم كبار العملاء المصرفيين (PCIS) © 2026 — بنك التسليف التعاوني والزراعي (CAC Bank)
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            تشفير وتخزين محلي آمن 100% • خوارزميات حتمية قابلة للتدقيق الكامل
          </span>
        </div>
      </footer>
    </div>
  );
}
