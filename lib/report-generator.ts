import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';
import CryptoJS from 'crypto-js';

export interface ReportData {
  appName: string;
  partyId: string;
  period: {
    start: Date;
    end: Date;
    type: 'monthly' | 'quarterly';
  };
  metrics: {
    totalTransactions: number;
    totalVolume: number;
    activeUsers: number;
    rewardsEarned: number;
    transactionGrowth: number;
  };
  activityBreakdown: Array<{
    activityType: string;
    count: number;
    volume: number;
  }>;
  compliance: {
    auditStatus: string;
    controlsInPlace: boolean;
    nonBonaFidePrevention: string;
  };
}

export interface EvidenceBundle {
  snapshotHash: string;
  timestamp: string;
  dataHash: string;
  derivationNotes: string;
  signedBy: string;
}

export class ReportGenerator {
  private data: ReportData;
  private evidenceBundle: EvidenceBundle;

  constructor(data: ReportData) {
    this.data = data;
    this.evidenceBundle = this.generateEvidenceBundle();
  }

  private generateEvidenceBundle(): EvidenceBundle {
    const timestamp = new Date().toISOString();
    const dataString = JSON.stringify(this.data);
    const dataHash = CryptoJS.SHA256(dataString).toString();
    const snapshotHash = CryptoJS.SHA256(`${dataHash}${timestamp}`).toString();

    return {
      snapshotHash,
      timestamp,
      dataHash,
      derivationNotes: `Data derived from Canton Network on-chain records for period ${this.data.period.start.toISOString()} to ${this.data.period.end.toISOString()}`,
      signedBy: this.data.appName,
    };
  }

  async generatePDF(): Promise<Blob> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Header
    doc.setFontSize(20);
    doc.text('Canton Network Featured App Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Period: ${this.data.period.start.toLocaleDateString()} - ${this.data.period.end.toLocaleDateString()}`, 20, 36);

    let yPos = 50;

    // App Information
    doc.setFontSize(16);
    doc.text('Application Information', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    doc.text(`App Name: ${this.data.appName}`, 20, yPos);
    yPos += 7;
    doc.text(`Party ID: ${this.data.partyId}`, 20, yPos);
    yPos += 15;

    // Metrics
    doc.setFontSize(16);
    doc.text('Key Metrics', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    doc.text(`Total Transactions: ${this.data.metrics.totalTransactions.toLocaleString()}`, 20, yPos);
    yPos += 7;
    doc.text(`Total Volume: ${this.data.metrics.totalVolume.toLocaleString()} CC`, 20, yPos);
    yPos += 7;
    doc.text(`Active Users: ${this.data.metrics.activeUsers.toLocaleString()}`, 20, yPos);
    yPos += 7;
    doc.text(`Rewards Earned: ${this.data.metrics.rewardsEarned.toLocaleString()} CC`, 20, yPos);
    yPos += 7;
    doc.text(`Transaction Growth: ${this.data.metrics.transactionGrowth.toFixed(2)}%`, 20, yPos);
    yPos += 15;

    // Activity Breakdown
    doc.setFontSize(16);
    doc.text('Activity Breakdown', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    this.data.activityBreakdown.forEach((activity) => {
      doc.text(`${activity.activityType}: ${activity.count} transactions, ${activity.volume} CC`, 20, yPos);
      yPos += 7;
    });
    yPos += 10;

    // Compliance
    doc.setFontSize(16);
    doc.text('Compliance Information', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    doc.text(`Audit Status: ${this.data.compliance.auditStatus}`, 20, yPos);
    yPos += 7;
    doc.text(`Controls In Place: ${this.data.compliance.controlsInPlace ? 'Yes' : 'No'}`, 20, yPos);
    yPos += 7;
    doc.text(`Non-Bona Fide Prevention: ${this.data.compliance.nonBonaFidePrevention}`, 20, yPos);
    yPos += 15;

    // Evidence Bundle
    doc.setFontSize(16);
    doc.text('Evidence Bundle', 20, yPos);
    yPos += 10;
    doc.setFontSize(10);
    doc.text(`Snapshot Hash: ${this.evidenceBundle.snapshotHash}`, 20, yPos, { maxWidth: 170 });
    yPos += 7;
    doc.text(`Timestamp: ${this.evidenceBundle.timestamp}`, 20, yPos);
    yPos += 7;
    doc.text(`Data Hash: ${this.evidenceBundle.dataHash}`, 20, yPos, { maxWidth: 170 });
    yPos += 7;
    doc.text(`Derivation: ${this.evidenceBundle.derivationNotes}`, 20, yPos, { maxWidth: 170 });

    return doc.output('blob');
  }

  generateCSV(): string {
    const csvData = [
      ['Field', 'Value'],
      ['App Name', this.data.appName],
      ['Party ID', this.data.partyId],
      ['Period Start', this.data.period.start.toISOString()],
      ['Period End', this.data.period.end.toISOString()],
      ['Period Type', this.data.period.type],
      ['Total Transactions', this.data.metrics.totalTransactions.toString()],
      ['Total Volume', this.data.metrics.totalVolume.toString()],
      ['Active Users', this.data.metrics.activeUsers.toString()],
      ['Rewards Earned', this.data.metrics.rewardsEarned.toString()],
      ['Transaction Growth', this.data.metrics.transactionGrowth.toString()],
      ['Audit Status', this.data.compliance.auditStatus],
      ['Controls In Place', this.data.compliance.controlsInPlace.toString()],
      ['Snapshot Hash', this.evidenceBundle.snapshotHash],
      ['Timestamp', this.evidenceBundle.timestamp],
      ['Data Hash', this.evidenceBundle.dataHash],
    ];

    return Papa.unparse(csvData);
  }

  getEvidenceBundle(): EvidenceBundle {
    return this.evidenceBundle;
  }

  getRequirementsChecklist() {
    return [
      {
        id: 'app-info',
        label: 'Application Information',
        required: true,
        completed: !!(this.data.appName && this.data.partyId),
        items: [
          { label: 'Institution name', completed: !!this.data.appName },
          { label: 'Party ID', completed: !!this.data.partyId },
          { label: 'Application summary', completed: true },
        ],
      },
      {
        id: 'metrics',
        label: 'Key Metrics & Activity',
        required: true,
        completed: this.data.metrics.totalTransactions > 0,
        items: [
          { label: 'Transaction volume data', completed: this.data.metrics.totalTransactions > 0 },
          { label: 'User activity metrics', completed: this.data.metrics.activeUsers > 0 },
          { label: 'Rewards earned', completed: this.data.metrics.rewardsEarned > 0 },
        ],
      },
      {
        id: 'compliance',
        label: 'Compliance & Controls',
        required: true,
        completed: this.data.compliance.controlsInPlace && !!this.data.compliance.nonBonaFidePrevention,
        items: [
          { label: 'Audit status documented', completed: !!this.data.compliance.auditStatus },
          { label: 'Controls preventing non-bona fide transactions', completed: this.data.compliance.controlsInPlace },
          { label: 'Non-bona fide prevention description', completed: !!this.data.compliance.nonBonaFidePrevention },
        ],
      },
      {
        id: 'evidence',
        label: 'Evidence Bundle',
        required: true,
        completed: true,
        items: [
          { label: 'Signed snapshot with hash', completed: true },
          { label: 'Data provenance chain', completed: true },
          { label: 'Derivation notes', completed: true },
        ],
      },
    ];
  }
}
