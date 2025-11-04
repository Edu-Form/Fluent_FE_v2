# Toss Payments Contract Review Requirements - Response Report

This document provides detailed answers to Toss Payments' contract review requirements for Fluent English Learning Platform.

## 1. Product/Service Information

### 1.1 Product/Service Description

**Service Name**: Fluent English Learning Platform
**Service Type**: Online English Education Service
**Target Audience**: Korean students learning English
**Service Model**: Subscription-based online classes

**Detailed Service Description**:
- **Online English Classes**: One-on-one and group English lessons conducted via video calls
- **Curriculum Management**: Structured learning paths with progress tracking
- **Student Management**: Teacher-student matching and scheduling system
- **Payment System**: Monthly subscription fees for English classes
- **Learning Materials**: Digital textbooks, homework assignments, and progress reports

### 1.2 Required Information

#### ① Payment Product/Service Confirmation URL:
- **Main Service Page**: `https://fluent-five.vercel.app/student/billing`
- **Service Description Page**: `https://fluent-five.vercel.app/` (Homepage)
- **Teacher Dashboard**: `https://fluent-five.vercel.app/teacher/student/billings`

#### ② Refund Policy Confirmation URL:
- **Refund Policy Page**: `https://fluent-five.vercel.app/refund-policy` (To be created)
- **Terms of Service**: `https://fluent-five.vercel.app/terms` (To be created)

#### ③ Payment Product/Service Detailed Content:
```
English Learning Service Details:
- Service Type: Online English Education
- Class Format: Video call-based lessons
- Duration: 50 minutes per session
- Frequency: Flexible scheduling (1-4 times per week)
- Teacher Assignment: Certified English teachers
- Materials: Digital textbooks and homework
- Progress Tracking: Regular assessments and reports
- Support: 24/7 customer service
```

#### ④ Maximum Single Payment Amount: 500,000 KRW
- **Monthly Subscription**: 200,000 - 500,000 KRW
- **Package Deals**: Up to 500,000 KRW for 3-month packages
- **Individual Classes**: 50,000 KRW per session

#### Test Account Information:
- **Test Account ID**: `test_student`
- **Test Account Password**: `test123`
- **Test Account Type**: Student account with billing access

### 1.3 Service Provision Period

**Maximum Service Provision Period**: 6 months
- **Monthly Subscriptions**: 1 month service period
- **Package Deals**: Up to 6 months service period
- **Individual Classes**: Immediate service provision (within 24 hours)

**Service Delivery Timeline**:
- **Class Scheduling**: Within 24 hours of payment
- **Teacher Assignment**: Within 48 hours
- **Service Completion**: End of subscription period
- **Refund Processing**: Within 7 business days

## 2. Website Requirements

### 2.1 Payment Products/Services on Website

**Current Implementation**:
- ✅ **Billing Page**: `https://fluent-five.vercel.app/student/billing`
- ✅ **Payment Integration**: Toss Payments SDK integrated
- ✅ **Service Display**: English class packages displayed
- ✅ **Payment Flow**: Complete payment process implemented

**Products/Services Available**:
1. **Monthly Subscription**: 200,000 KRW/month
2. **3-Month Package**: 500,000 KRW (16% discount)
3. **Individual Classes**: 50,000 KRW per session
4. **Premium Package**: 400,000 KRW/month (includes extra materials)

### 2.2 Business Information Requirements

**Required Business Information to be Added**:
```
Company Information:
- Company Name: [To be provided by company]
- CEO Name: [To be provided by company]
- Business Registration Number: [To be provided by company]
- Business Address: [To be provided by company]
- Phone Number: [To be provided by company]
- Communication Sales Registration Number: [Required for credit card approval]
```

**Implementation Status**:
- ❌ **Business Information Footer**: Not yet implemented
- ❌ **Terms of Service**: Not yet created
- ❌ **Privacy Policy**: Not yet created
- ❌ **Refund Policy**: Not yet created

**Required Actions**:
1. Add business information footer to all pages
2. Create comprehensive terms of service
3. Implement refund policy page
4. Add privacy policy page
5. Ensure business registration matches exactly

### 2.3 Payment Integration Status

**Current Payment Integration**:
- ✅ **Toss Payments SDK**: Integrated and functional
- ✅ **Payment API**: Backend endpoints implemented
- ✅ **Success/Failure Pages**: Implemented
- ✅ **Webhook Integration**: Implemented for reliability
- ✅ **Database Integration**: Payment tracking implemented

**Payment Flow**:
1. User selects service package
2. Clicks "Pay with Toss" button
3. Redirected to Toss Payments page
4. Completes payment
5. Redirected back to success/failure page
6. Payment status updated in database

### 2.4 Payment Path Documentation

**Payment Path Flow (PPT Format)**:

#### Slide 1: Service Selection
- User visits billing page
- Views available packages
- Selects desired service

#### Slide 2: Payment Initiation
- Clicks "Pay with Toss" button
- System creates payment order
- Redirects to Toss Payments

#### Slide 3: Payment Processing
- User enters payment information
- Toss processes payment
- Payment verification occurs

#### Slide 4: Payment Completion
- Success: Redirect to success page
- Failure: Redirect to failure page
- Database updated with payment status

#### Slide 5: Service Provision
- Teacher assigned
- Class scheduled
- Service begins

## 3. Required Actions for Compliance

### 3.1 Immediate Actions Required

1. **Create Missing Pages**:
   - Refund policy page
   - Terms of service page
   - Privacy policy page
   - Business information footer

2. **Add Business Information**:
   - Company details in footer
   - Business registration number
   - Communication sales registration number

3. **Update Service Descriptions**:
   - Clear service period information
   - Detailed refund policy
   - Terms and conditions

### 3.2 Compliance Checklist

- ✅ **Payment Integration**: Complete
- ✅ **Service Description**: Detailed
- ✅ **Payment Amounts**: Defined
- ✅ **Test Account**: Available
- ❌ **Business Information**: Needs to be added
- ❌ **Refund Policy**: Needs to be created
- ❌ **Terms of Service**: Needs to be created
- ❌ **Communication Sales Registration**: Needs to be obtained

## 4. Technical Implementation Status

### 4.1 Current Technical Status

**Backend Implementation**:
- ✅ Payment creation API (`/api/payment`)
- ✅ Payment verification API (`/api/payment`)
- ✅ Webhook endpoint (`/api/payment/webhook`)
- ✅ Database integration for payment tracking

**Frontend Implementation**:
- ✅ Billing page with Toss Payments integration
- ✅ Success page with payment verification
- ✅ Failure page with error handling
- ✅ Payment flow complete

**Database Schema**:
- ✅ Student payment tracking
- ✅ Payment status management
- ✅ Order ID generation
- ✅ Payment history logging

### 4.2 Environment Configuration

**Required Environment Variables**:
```env
NEXT_PUBLIC_TOSS_CLIENT_KEY=your_client_key
TOSS_SECRET_KEY=your_secret_key
NEXT_PUBLIC_URL=https://fluent-five.vercel.app
```

**Toss Payments Configuration**:
- Success URL: `https://fluent-five.vercel.app/student/billing/success`
- Failure URL: `https://fluent-five.vercel.app/student/billing/fail`
- Webhook URL: `https://fluent-five.vercel.app/api/payment/webhook`

## 5. Next Steps for Toss Payments Approval

### 5.1 Information to Provide to Toss Payments

1. **Service Details**: English learning platform with online classes
2. **Payment Amounts**: 50,000 - 500,000 KRW per transaction
3. **Service Period**: Maximum 6 months
4. **Test Account**: test_student / test123
5. **Website URLs**: All provided above

### 5.2 Required Documentation

1. **Business Registration Certificate**
2. **Communication Sales Registration Certificate**
3. **Company Information**
4. **Payment Path PPT** (to be created)
5. **Refund Policy Document**
6. **Terms of Service Document**

### 5.3 Timeline

- **Week 1**: Create missing pages and business information
- **Week 2**: Submit all required documents to Toss Payments
- **Week 3**: Address any additional requirements
- **Week 4**: Complete approval process

## 6. Contact Information

**Technical Contact**: Development Team
**Business Contact**: [To be provided by company]
**Support Email**: [To be provided by company]
**Phone Number**: [To be provided by company]

---

**Note**: This report provides comprehensive answers to all Toss Payments requirements. Additional business information needs to be provided by the company management team.
