-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('ISSUED', 'SENT', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('GTGT', 'BAN_HANG', 'TAI_SAN_CONG', 'DU_TRU_QG');

-- CreateEnum
CREATE TYPE "InvoiceForm" AS ENUM ('WITH_TAX_CODE', 'WITHOUT_TAX_CODE', 'POS_CONNECTED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "hashedRefreshToken" TEXT,
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "companyName" TEXT NOT NULL DEFAULT 'CÔNG TY TNHH GIÁO DỤC AI ROBOTIC',
    "taxCode" TEXT DEFAULT '3603893101',
    "address" TEXT DEFAULT 'Số 10 Huỳnh Văn Nghệ, P. Trấn Biên, Đồng Nai',
    "phone" TEXT DEFAULT '0900000000',
    "email" TEXT DEFAULT 'contact@airobotics.edu.vn',
    "logoUrl" TEXT,
    "companies" TEXT,
    "bankCode" TEXT DEFAULT 'Vietcombank',
    "bankAccount" TEXT DEFAULT 'SHYNNERI',
    "bankAccountName" TEXT DEFAULT 'AI ROBOTIC',
    "bankAccounts" TEXT,
    "qrTemplate" TEXT DEFAULT 'compact',
    "invoicePrefix" TEXT NOT NULL DEFAULT 'HD',
    "invoiceNumberLength" INTEGER NOT NULL DEFAULT 6,
    "nextInvoiceNumber" INTEGER NOT NULL DEFAULT 1,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'VND',
    "defaultVatRate" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "emailAlertSubject" TEXT,
    "emailAlertBody" TEXT,
    "invoiceEmailSubject" TEXT,
    "invoiceEmailBody" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceType" "InvoiceType" NOT NULL DEFAULT 'GTGT',
    "invoiceForm" "InvoiceForm" NOT NULL DEFAULT 'WITH_TAX_CODE',
    "paymentCode" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'ISSUED',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "templateId" TEXT NOT NULL DEFAULT 'standard-classic',
    "notes" TEXT,
    "terms" TEXT,
    "sellerName" TEXT,
    "sellerTaxCode" TEXT,
    "sellerAddress" TEXT,
    "sellerPhone" TEXT,
    "sellerEmail" TEXT,
    "sellerLogoUrl" TEXT,
    "buyerName" TEXT NOT NULL,
    "buyerCompany" TEXT,
    "buyerTaxCode" TEXT,
    "buyerAddress" TEXT,
    "buyerEmail" TEXT,
    "buyerPhone" TEXT,
    "hasVat" BOOLEAN NOT NULL DEFAULT true,
    "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "subTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vatAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grandTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qrDataUrl" TEXT,
    "pdfUrl" TEXT,
    "shareToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metaInfo" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'dịch vụ',
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceHistory" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "actor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCatalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metaInfo" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'gói',
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSubscription" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerCompany" TEXT,
    "serviceId" TEXT,
    "serviceName" TEXT NOT NULL,
    "servicePrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cycle" TEXT DEFAULT '1 năm',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "staffName" TEXT,
    "staffEmail" TEXT,
    "notes" TEXT,
    "lastAlertSentAt" TIMESTAMP(3),
    "alertCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_shareToken_key" ON "Invoice"("shareToken");

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceHistory" ADD CONSTRAINT "InvoiceHistory_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

