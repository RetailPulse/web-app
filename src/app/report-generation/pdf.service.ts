import {Injectable} from '@angular/core';
import {CellConfig, jsPDF} from "jspdf";
import {InventoryTransactionModel} from './inventory-transaction.model';
import {formatCurrency} from '@angular/common';

@Injectable({providedIn: 'root'})
export class PdfService {

  generatePdf(startDate: string, endDate: string, data: InventoryTransactionModel[]) {
    const title = 'Inventory Transaction Report';
    const fileName = 'inventory-transaction-report.pdf';
    const doc = new jsPDF('landscape');
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    const titleXPos = (doc.internal.pageSize.getWidth() / 2) - (doc.getTextWidth(title) / 2);
    doc.text(title, titleXPos, 20);
    doc.setFontSize(12);
    doc.text('Start Date  : ' + startDate, 25, 30);
    doc.text('End Date    : ' + endDate, 25, 40);
    doc.setFont('helvetica', 'normal');
    doc.table(
      10,
      50,
      this.getDataForPdfTable(data),
      this.createHeadersForPdfTable(),
      {
        autoSize: false,
        fontSize: 8
      }
    );
    doc.text('Grand Total Cost:  ' + this.formatCurrency(this.getGrandTotalCost(data)), 151, (data.length * 20) + 60);
    doc.save(fileName);
  }

  private getDataForPdfTable(inventoryTransactionModels: InventoryTransactionModel[]) {
    const data = [];
    for (let i = 0; i < inventoryTransactionModels.length; i++) {
      data.push({
        no: i + 1 + '',
        transactionId: inventoryTransactionModels[i].transactionId ? inventoryTransactionModels[i].transactionId : '-',
        sku: inventoryTransactionModels[i].product.sku ? inventoryTransactionModels[i].product.sku : '-',
        description: inventoryTransactionModels[i].product.description ? inventoryTransactionModels[i].product.description : '-',
        quantity: inventoryTransactionModels[i].productPricing.quantity ? inventoryTransactionModels[i].productPricing.quantity + '' : '-',
        costPricePerUnit: inventoryTransactionModels[i].productPricing.costPricePerUnit ? this.formatCurrency(inventoryTransactionModels[i].productPricing.costPricePerUnit) : '-',
        totalCost: inventoryTransactionModels[i].productPricing.totalCost ? this.formatCurrency(inventoryTransactionModels[i].productPricing.totalCost) : '-',
        source: inventoryTransactionModels[i].source ? inventoryTransactionModels[i].source.name + '/' + inventoryTransactionModels[i].source.location + '/' + inventoryTransactionModels[i].source.type : '-',
        destination: inventoryTransactionModels[i].destination ? inventoryTransactionModels[i].destination.name + '/' + inventoryTransactionModels[i].destination.location + '/' + inventoryTransactionModels[i].destination.type : '-',
        transactionDateTime: inventoryTransactionModels[i].transactionDateTime ? inventoryTransactionModels[i].transactionDateTime + '' : '-',
      });
    }
    return data;
  }

  private getGrandTotalCost(inventoryTransactionModels: InventoryTransactionModel[]): number {
    let grandTotalCost = 0;
    for (let i = 0; i < inventoryTransactionModels.length; i++) {
      grandTotalCost += inventoryTransactionModels[i].productPricing.totalCost;
    }
    return grandTotalCost;
  }

  private createHeadersForPdfTable() {
    const result: CellConfig[] = [
      {
        name: 'no',
        prompt: 'S/No.',
        width: 15,
        align: 'center',
        padding: 0
      },
      {
        name: 'transactionId',
        prompt: 'Transaction ID',
        width: 40,
        align: 'center',
        padding: 0
      },
      {
        name: 'sku',
        prompt: 'SKU',
        width: 40,
        align: 'center',
        padding: 0
      },
      {
        name: 'description',
        prompt: 'Description',
        width: 40,
        align: 'center',
        padding: 0
      },
      {
        name: 'quantity',
        prompt: 'Quantity',
        width: 25,
        align: 'right',
        padding: 0
      },
      {
        name: 'costPricePerUnit',
        prompt: 'Cost Price Per Unit',
        width: 40,
        align: 'right',
        padding: 0
      },
      {
        name: 'totalCost',
        prompt: 'Total Cost',
        width: 40,
        align: 'right',
        padding: 0
      },
      {
        name: 'source',
        prompt: 'Source',
        width: 40,
        align: 'center',
        padding: 0
      },
      {
        name: 'destination',
        prompt: 'Destination',
        width: 40,
        align: 'center',
        padding: 0
      },
      {
        name: 'transactionDateTime',
        prompt: 'Transaction Date Time',
        width: 40,
        align: 'center',
        padding: 0
      }
    ];

    return result;
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
    }).format(amount);
  }

}
