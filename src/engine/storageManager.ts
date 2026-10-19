/**
 * Local Storage & Data Store Manager for PCIS Banking Platform
 * Provides persistent local state, full backup/restore, audit logging,
 * and seamless fallback to the audited synthetic benchmark.
 * Safely handles iframe sandboxes where localStorage access might throw SecurityError.
 */

import {
  Customer,
  MonthlyBalance,
  MonthlyTransaction,
  CustomerEconomics,
  CustomerProduct,
  RelationshipActivity,
  Campaign,
  MethodologyConfig,
  AuditLogEntry,
} from '../types/banking';
import {
  SYNTHETIC_CUSTOMERS,
  SYNTHETIC_BALANCES,
  SYNTHETIC_TRANSACTIONS,
  SYNTHETIC_ECONOMICS,
  SYNTHETIC_PRODUCTS,
  SYNTHETIC_ACTIVITIES,
  SYNTHETIC_CAMPAIGNS,
} from '../data/syntheticBenchmarkData';
import { DEFAULT_METHODOLOGY } from './deterministicMath';

const KEYS = {
  CUSTOMERS: 'pcis_customers_v1',
  BALANCES: 'pcis_balances_v1',
  TRANSACTIONS: 'pcis_transactions_v1',
  ECONOMICS: 'pcis_economics_v1',
  PRODUCTS: 'pcis_products_v1',
  ACTIVITIES: 'pcis_activities_v1',
  CAMPAIGNS: 'pcis_campaigns_v1',
  METHODOLOGY: 'pcis_methodology_v1',
  AUDIT_LOGS: 'pcis_audit_logs_v1',
};

// In-memory fallback if localStorage is blocked or throws in iframe
const memoryFallback: Record<string, string> = {};

function safeGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (e) {
    // Access denied in iframe sandbox
  }
  return memoryFallback[key] || null;
}

function safeSet(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (e) {
    // Access denied in iframe sandbox
  }
  memoryFallback[key] = value;
}

function safeRemove(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (e) {
    // Access denied in iframe sandbox
  }
  delete memoryFallback[key];
}

export class StorageManager {
  static getCustomers(): Customer[] {
    try {
      const raw = safeGet(KEYS.CUSTOMERS);
      if (!raw) {
        this.saveCustomers(SYNTHETIC_CUSTOMERS, false);
        return SYNTHETIC_CUSTOMERS;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      return SYNTHETIC_CUSTOMERS;
    } catch {
      return SYNTHETIC_CUSTOMERS;
    }
  }

  static saveCustomers(customers: Customer[], logAction = true): void {
    try {
      safeSet(KEYS.CUSTOMERS, JSON.stringify(customers));
      if (logAction) {
        this.logAudit('IMPORT', `تحديث سجلات العملاء بإجمالي ${customers.length} عميل`);
      }
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }

  static getBalances(): MonthlyBalance[] {
    try {
      const raw = safeGet(KEYS.BALANCES);
      if (!raw) {
        this.saveBalances(SYNTHETIC_BALANCES);
        return SYNTHETIC_BALANCES;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      return SYNTHETIC_BALANCES;
    } catch {
      return SYNTHETIC_BALANCES;
    }
  }

  static saveBalances(balances: MonthlyBalance[]): void {
    try {
      safeSet(KEYS.BALANCES, JSON.stringify(balances));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }

  static getTransactions(): MonthlyTransaction[] {
    try {
      const raw = safeGet(KEYS.TRANSACTIONS);
      if (!raw) {
        this.saveTransactions(SYNTHETIC_TRANSACTIONS);
        return SYNTHETIC_TRANSACTIONS;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      return SYNTHETIC_TRANSACTIONS;
    } catch {
      return SYNTHETIC_TRANSACTIONS;
    }
  }

  static saveTransactions(transactions: MonthlyTransaction[]): void {
    try {
      safeSet(KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }

  static getEconomics(): CustomerEconomics[] {
    try {
      const raw = safeGet(KEYS.ECONOMICS);
      if (!raw) {
        this.saveEconomics(SYNTHETIC_ECONOMICS);
        return SYNTHETIC_ECONOMICS;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      return SYNTHETIC_ECONOMICS;
    } catch {
      return SYNTHETIC_ECONOMICS;
    }
  }

  static saveEconomics(economics: CustomerEconomics[]): void {
    try {
      safeSet(KEYS.ECONOMICS, JSON.stringify(economics));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }

  static getProducts(): CustomerProduct[] {
    try {
      const raw = safeGet(KEYS.PRODUCTS);
      if (!raw) {
        this.saveProducts(SYNTHETIC_PRODUCTS);
        return SYNTHETIC_PRODUCTS;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      return SYNTHETIC_PRODUCTS;
    } catch {
      return SYNTHETIC_PRODUCTS;
    }
  }

  static saveProducts(products: CustomerProduct[]): void {
    try {
      safeSet(KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }

  static getActivities(): RelationshipActivity[] {
    try {
      const raw = safeGet(KEYS.ACTIVITIES);
      if (!raw) {
        this.saveActivities(SYNTHETIC_ACTIVITIES);
        return SYNTHETIC_ACTIVITIES;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      return SYNTHETIC_ACTIVITIES;
    } catch {
      return SYNTHETIC_ACTIVITIES;
    }
  }

  static saveActivities(activities: RelationshipActivity[]): void {
    try {
      safeSet(KEYS.ACTIVITIES, JSON.stringify(activities));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }

  static getCampaigns(): Campaign[] {
    try {
      const raw = safeGet(KEYS.CAMPAIGNS);
      if (!raw) {
        this.saveCampaigns(SYNTHETIC_CAMPAIGNS);
        return SYNTHETIC_CAMPAIGNS;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      return SYNTHETIC_CAMPAIGNS;
    } catch {
      return SYNTHETIC_CAMPAIGNS;
    }
  }

  static saveCampaigns(campaigns: Campaign[]): void {
    try {
      safeSet(KEYS.CAMPAIGNS, JSON.stringify(campaigns));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }

  static getMethodology(): MethodologyConfig {
    try {
      const raw = safeGet(KEYS.METHODOLOGY);
      if (!raw) {
        this.saveMethodology(DEFAULT_METHODOLOGY, false);
        return DEFAULT_METHODOLOGY;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_METHODOLOGY;
    }
  }

  static saveMethodology(config: MethodologyConfig, logAction = true): void {
    try {
      safeSet(KEYS.METHODOLOGY, JSON.stringify(config));
      if (logAction) {
        this.logAudit(
          'METHODOLOGY_CHANGE',
          `تحديث إصدار المنهجية إلى (${config.versionId}) والأوزان: A=${config.weightA}, G=${config.weightG}, R=${config.weightR}, E=${config.weightE}`
        );
      }
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }

  static getAuditLogs(): AuditLogEntry[] {
    try {
      const raw = safeGet(KEYS.AUDIT_LOGS);
      if (!raw) {
        const initialLogs: AuditLogEntry[] = [
          {
            id: 'log-001',
            timestamp: new Date().toISOString(),
            userEmail: 'mohammed.arif@cacbankyemen.com',
            actionType: 'CALCULATE',
            description: 'بدء تشغيل النظام واعتماد محرك التقييم الحتمي بنجاح.',
          },
        ];
        this.saveAuditLogs(initialLogs);
        return initialLogs;
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static saveAuditLogs(logs: AuditLogEntry[]): void {
    try {
      safeSet(KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(-200)));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }

  static logAudit(actionType: AuditLogEntry['actionType'], description: string, metadata?: Record<string, any>): void {
    try {
      const current = this.getAuditLogs();
      const newEntry: AuditLogEntry = {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        userEmail: 'mohammed.arif@cacbankyemen.com',
        actionType,
        description,
        metadata,
      };
      current.unshift(newEntry);
      this.saveAuditLogs(current);
    } catch (e) {
      console.warn('Audit log error:', e);
    }
  }

  static resetToBenchmark(): void {
    safeRemove(KEYS.CUSTOMERS);
    safeRemove(KEYS.BALANCES);
    safeRemove(KEYS.TRANSACTIONS);
    safeRemove(KEYS.ECONOMICS);
    safeRemove(KEYS.PRODUCTS);
    safeRemove(KEYS.ACTIVITIES);
    safeRemove(KEYS.CAMPAIGNS);
    safeRemove(KEYS.METHODOLOGY);
    this.logAudit('BACKUP_RESTORE', 'إعادة ضبط قاعدة البيانات المحلية إلى البيانات المعيارية الاصطناعية المعتمدة');
  }

  static exportFullBackupJSON(): string {
    const backup = {
      exportedAt: new Date().toISOString(),
      platform: 'PCIS Banking VIP Intelligence',
      version: '1.0.0',
      customers: this.getCustomers(),
      balances: this.getBalances(),
      transactions: this.getTransactions(),
      economics: this.getEconomics(),
      products: this.getProducts(),
      activities: this.getActivities(),
      campaigns: this.getCampaigns(),
      methodology: this.getMethodology(),
      auditLogs: this.getAuditLogs(),
    };
    this.logAudit('EXPORT', 'تصدير نسخة احتياطية كاملة من قاعدة البيانات بتنسيق JSON');
    return JSON.stringify(backup, null, 2);
  }

  static restoreFullBackupJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (!data.customers || !Array.isArray(data.customers)) {
        throw new Error('ملف النسخة الاحتياطية غير متوافق');
      }
      if (data.customers) this.saveCustomers(data.customers, false);
      if (data.balances) this.saveBalances(data.balances);
      if (data.transactions) this.saveTransactions(data.transactions);
      if (data.economics) this.saveEconomics(data.economics);
      if (data.products) this.saveProducts(data.products);
      if (data.activities) this.saveActivities(data.activities);
      if (data.campaigns) this.saveCampaigns(data.campaigns);
      if (data.methodology) this.saveMethodology(data.methodology, false);
      this.logAudit('BACKUP_RESTORE', `تمت استعادة نسخة احتياطية بنجاح (${data.customers.length} عميل)`);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}
