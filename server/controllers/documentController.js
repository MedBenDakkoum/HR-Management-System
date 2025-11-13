const PDFDocument = require("pdfkit");
const cloudinary = require("cloudinary").v2;
const { db, collections, admin } = require("../config/firebase");
const authMiddleware = require("../middleware/auth");
const { Readable } = require("stream");
const path = require("path"); // For path.basename() in download function

// Helper function to validate Firebase document ID
const isValidFirebaseId = (id) => {
  return typeof id === "string" && id.length > 0;
};

// Helper function to upload PDF buffer to Cloudinary
const uploadPDFToCloudinary = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    console.log("📤 Starting Cloudinary upload:", filename);
    console.log("   Buffer size:", buffer.length, "bytes");
    
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: `flesk_generated_documents/${filename}`,
        format: "pdf",
        access_mode: "public",
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          console.error("❌ Cloudinary upload error:", error.message);
          reject(error);
        } else {
          console.log("✅ Cloudinary upload successful:", result.secure_url);
          resolve(result);
        }
      }
    );

    // Convert buffer to readable stream and pipe to Cloudinary
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
    
    // Handle stream errors
    readableStream.on('error', (error) => {
      console.error("❌ Stream error:", error.message);
      reject(error);
    });
    
    uploadStream.on('error', (error) => {
      console.error("❌ Upload stream error:", error.message);
      reject(error);
    });
  });
};

const generateAttestation = async (req, res) => {
  try {
    const { employeeId, legalInfo } = req.body;

    // RBAC check
    if (!req.user || !req.user.id || !req.user.role) {
      return res
        .status(401)
        .json({ message: "User authentication data missing" });
    }
    const userId = req.user.id;
    if (req.user.role !== "admin" && employeeId !== userId) {
      return res.status(403).json({
        message:
          "Access denied: Only admins can generate attestations for any employee, or employees/stagiaires can only generate their own",
      });
    }

    const employeeDoc = await db()
      .collection(collections.EMPLOYEES)
      .doc(employeeId)
      .get();

    if (!employeeDoc.exists) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const employee = { id: employeeDoc.id, ...employeeDoc.data() };

    const docName = `attestation-${employeeId}-${Date.now()}`;

    console.log("📄 Generating PDF:", docName);

    // Create PDF in memory (no file system)
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    // Collect PDF data in memory
    const chunks = [];
    doc.on("data", (chunk) => {
      chunks.push(chunk);
      console.log("   Chunk received, size:", chunk.length);
    });
    doc.on("end", () => {
      console.log("📄 PDF generation complete, total chunks:", chunks.length);
    });

    // Add logo as text (or skip logo for serverless compatibility)
    doc.fontSize(16).text("FLESK", 50, 50, { align: "left" });
    doc.moveDown(2);

    doc
      .font("Times-Roman")
      .fontSize(20)
      .text("Attestation of Work/Internship", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text("FLESK Consulting", { align: "center" });
    doc.moveDown(2);

    doc
      .fontSize(12)
      .text(
        `This is to certify that ${employee.name} has been employed as a ${
          employee.role === "stagiaire"
            ? "Stagiaire"
            : employee.position || "Employee"
        } at FLESK Consulting.`,
        { align: "justify" }
      );
    doc.moveDown();

    if (employee.role === "stagiaire" && employee.internshipDetails) {
      const startDate = employee.internshipDetails.startDate;
      const endDate = employee.internshipDetails.endDate;
      
      doc.text(
        `Internship Period: ${
          startDate
            ? new Date(
                startDate.toDate ? startDate.toDate() : startDate
              ).toLocaleDateString()
            : "N/A"
        } to ${
          endDate
            ? new Date(
                endDate.toDate ? endDate.toDate() : endDate
              ).toLocaleDateString()
            : "N/A"
        }`
      );
      doc.text(`Supervisor: ${employee.internshipDetails.supervisor || "N/A"}`);
      doc.text(`Objectives: ${employee.internshipDetails.objectives || "N/A"}`);
      doc.moveDown();
    }

    doc.text(
      `Legal Information: ${
        legalInfo || "FLESK Consulting, 123 Business St, Monastir, Moknine"
      }`
    );
    doc.moveDown(2);
    doc.text("Authorized Signature: ____________________", { align: "right" });
    doc.moveDown();
    doc.lineWidth(1).moveTo(450, doc.y).lineTo(650, doc.y).stroke();

    doc.end();

    // Wait for PDF generation to complete
    await new Promise((resolve, reject) => {
      doc.on("end", resolve);
      doc.on("error", reject);
    });

    console.log("📦 Combining chunks into buffer...");
    // Combine chunks into buffer
    const pdfBuffer = Buffer.concat(chunks);
    console.log("📦 Buffer created, size:", pdfBuffer.length, "bytes");

    if (pdfBuffer.length === 0) {
      throw new Error("PDF buffer is empty - no data generated");
    }

    // Upload buffer directly to Cloudinary (no file system)
    console.log("☁️  Uploading attestation to Cloudinary...");
    const cloudinaryResult = await uploadPDFToCloudinary(pdfBuffer, docName);
    console.log("✅ Attestation saved to Cloudinary:", cloudinaryResult.secure_url);

    // Save document to Firestore
    const documentData = {
      employeeId: employeeId,
      type: "attestation",
      fileUrl: cloudinaryResult.secure_url,
      legalInfo: legalInfo || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const documentRef = await db()
      .collection(collections.DOCUMENTS)
      .add(documentData);

    const documentDoc = await documentRef.get();
    const document = { 
      id: documentDoc.id,
      _id: documentDoc.id,
      ...documentDoc.data(),
      generatedDate: documentDoc.data().createdAt,
    };

    res
      .status(201)
      .json({ message: "Attestation generated successfully", document });
  } catch (error) {
    console.error("Generate attestation error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const generatePaySlip = async (req, res) => {
  try {
    const { employeeId, month, year, salary, deductions, bonuses } = req.body;

    const employeeDoc = await db()
      .collection(collections.EMPLOYEES)
      .doc(employeeId)
      .get();

    if (!employeeDoc.exists) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const employee = { id: employeeDoc.id, ...employeeDoc.data() };

    const docName = `payslip-${employeeId}-${month}-${year}-${Date.now()}`;

    console.log("📄 Generating payslip PDF:", docName);

    // Create PDF in memory (no file system)
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    // Collect PDF data in memory
    const chunks = [];
    doc.on("data", (chunk) => {
      chunks.push(chunk);
      console.log("   Chunk received, size:", chunk.length);
    });
    doc.on("end", () => {
      console.log("📄 PDF generation complete, total chunks:", chunks.length);
    });

    // Add logo as text (or skip logo for serverless compatibility)
    doc.fontSize(16).text("FLESK", 50, 50, { align: "left" });
    doc.moveDown(2);

    doc
      .font("Times-Roman")
      .fontSize(20)
      .text(`Pay Slip - ${month}/${year}`, { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text("FLESK Consulting", { align: "center" });
    doc.moveDown(2);

    doc.fontSize(12).text(`Employee: ${employee.name}`);
    doc.text(`Position: ${employee.position || "N/A"}`);
    doc.text(
      `Role: ${employee.role === "stagiaire" ? "Stagiaire" : "Employee"}`
    );
    doc.moveDown();

    doc.text(`Salary: $${salary.toFixed(2)}`);
    doc.text(`Deductions: $${deductions.toFixed(2)}`);
    doc.text(`Bonuses: $${bonuses.toFixed(2)}`);
    doc.text(`Net Pay: $${(salary - deductions + bonuses).toFixed(2)}`);
    doc.moveDown(2);

    doc.text("Authorized Signature: ____________________", { align: "right" });
    doc.moveDown();
    doc.lineWidth(1).moveTo(450, doc.y).lineTo(650, doc.y).stroke();

    doc.end();

    // Wait for PDF generation to complete
    await new Promise((resolve, reject) => {
      doc.on("end", resolve);
      doc.on("error", reject);
    });

    console.log("📦 Combining chunks into buffer...");
    // Combine chunks into buffer
    const pdfBuffer = Buffer.concat(chunks);
    console.log("📦 Buffer created, size:", pdfBuffer.length, "bytes");

    if (pdfBuffer.length === 0) {
      throw new Error("PDF buffer is empty - no data generated");
    }

    // Upload buffer directly to Cloudinary (no file system)
    console.log("☁️  Uploading payslip to Cloudinary...");
    const cloudinaryResult = await uploadPDFToCloudinary(pdfBuffer, docName);
    console.log("✅ Payslip saved to Cloudinary:", cloudinaryResult.secure_url);

    // Save document to Firestore
    const documentData = {
      employeeId: employeeId,
      type: "payslip",
      fileUrl: cloudinaryResult.secure_url,
      month,
      year,
      salary,
      deductions,
      bonuses,
      netPay: salary - deductions + bonuses,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const documentRef = await db()
      .collection(collections.DOCUMENTS)
      .add(documentData);

    const documentDoc = await documentRef.get();
    const document = { 
      id: documentDoc.id,
      _id: documentDoc.id,
      ...documentDoc.data(),
      generatedDate: documentDoc.data().createdAt,
    };

    res
      .status(201)
      .json({ message: "Pay slip generated successfully", document });
  } catch (error) {
    console.error("Generate pay slip error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getDocuments = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    if (!isValidFirebaseId(employeeId)) {
      return res.status(400).json({ message: "Invalid employee ID format" });
    }
    
    console.log("Querying documents for employeeId:", employeeId);
    
    const documentsSnapshot = await db()
      .collection(collections.DOCUMENTS)
      .where("employeeId", "==", employeeId)
      .get();

    console.log("Documents found for employee:", documentsSnapshot.size);

    if (documentsSnapshot.empty) {
      console.log("No documents for this employee - returning empty array");
      // Return empty array instead of 404 to allow graceful empty state
      return res.status(200).json([]);
    }

    const documents = [];
    for (const doc of documentsSnapshot.docs) {
      const data = doc.data();
      
      // Populate employee data
      const employeeDoc = await db()
        .collection(collections.EMPLOYEES)
        .doc(data.employeeId)
        .get();

      documents.push({
        id: doc.id,
        _id: doc.id, // For backward compatibility
        ...data,
        generatedDate: data.createdAt, // Alias for frontend compatibility
        employee: employeeDoc.exists
          ? {
              id: employeeDoc.id,
              name: employeeDoc.data().name,
            }
          : null,
      });
    }

    console.log("Returning", documents.length, "documents for employee");
    res.status(200).json(documents);
  } catch (error) {
    console.error("Get documents error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllAttestations = async (req, res) => {
  try {
    console.log("Querying all attestations");
    
    const documentsSnapshot = await db()
      .collection(collections.DOCUMENTS)
      .where("type", "==", "attestation")
      .get();

    console.log("Attestations found:", documentsSnapshot.size);

    if (documentsSnapshot.empty) {
      console.log("No attestations found - returning empty array");
      // Return empty array instead of 404 to allow graceful empty state
      return res.status(200).json([]);
    }

    const documents = [];
    for (const doc of documentsSnapshot.docs) {
      const data = doc.data();
      
      // Populate employee data
      const employeeDoc = await db()
        .collection(collections.EMPLOYEES)
        .doc(data.employeeId)
        .get();

      documents.push({
        id: doc.id,
        _id: doc.id, // For backward compatibility
        ...data,
        generatedDate: data.createdAt, // Alias for frontend compatibility
        employee: employeeDoc.exists
          ? {
              id: employeeDoc.id,
              name: employeeDoc.data().name,
            }
          : null,
      });
    }

    console.log("Returning", documents.length, "attestations");
    res.status(200).json(documents);
  } catch (error) {
    console.error("Get all attestations error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const downloadDocument = async (req, res) => {
  try {
    const docId = req.params.docId;
    
    console.log("Download request for document ID:", docId);
    
    if (!isValidFirebaseId(docId)) {
      console.log("Invalid document ID format:", docId);
      return res.status(400).json({ message: "Invalid document ID format" });
    }

    const documentDoc = await db()
      .collection(collections.DOCUMENTS)
      .doc(docId)
      .get();

    console.log("Document exists?", documentDoc.exists);

    if (!documentDoc.exists) {
      console.log("Document not found in Firestore:", docId);
      return res.status(404).json({ message: "Document not found" });
    }

    const document = { id: documentDoc.id, ...documentDoc.data() };

    // Extract public_id and verify resource
    const publicId = document.fileUrl.match(
      /flesk_generated_documents\/[^\/]+/
    )[0];
    const result = await cloudinary.api.resource(publicId, {
      resource_type: "raw",
    });
    if (!result || !result.secure_url) {
      return res
        .status(404)
        .json({ message: "Resource not found in Cloudinary" });
    }

    // RBAC check
    if (!req.user || !req.user.id || !req.user.role) {
      return res
        .status(401)
        .json({ message: "User authentication data missing" });
    }
    const userId = req.user.id;
    if (req.user.role !== "admin" && document.employeeId !== userId) {
      return res.status(403).json({
        message:
          "Access denied: Only admins can download all documents, or employees can only download their own",
      });
    }

    // Check if the file is publicly accessible
    const fileUrl = result.secure_url;
    const accessCheck = await fetch(fileUrl, { method: "HEAD" });
    if (!accessCheck.ok) {
      console.log(
        "Public access failed, generating signed URL:",
        fileUrl,
        accessCheck.status,
        accessCheck.statusText
      );
      const timestamp = Math.floor(Date.now() / 1000) + 3600; // 1-hour expiration
      const signature = cloudinary.utils.api_sign_request(
        {
          public_id: publicId,
          timestamp,
          resource_type: "raw",
          type: "upload",
        },
        process.env.CLOUDINARY_API_SECRET
      );
      const signedUrl = cloudinary.url(publicId, {
        resource_type: "raw",
        type: "upload",
        sign_url: true,
        signature: signature,
        timestamp: timestamp,
        api_key: process.env.CLOUDINARY_API_KEY,
      });
      console.log("Generated signed URL:", signedUrl);
      const streamResponse = await fetch(signedUrl);
      if (!streamResponse.ok) {
        throw new Error(
          `Failed to fetch signed URL: ${streamResponse.statusText}`
        );
      }
      // Handle the stream using getReader
      const reader = streamResponse.body.getReader();
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${path.basename(signedUrl)}"`
      );
      res.setHeader("Content-Type", "application/pdf");
      reader.read().then(function processText({ done, value }) {
        if (done) {
          res.end();
          return;
        }
        res.write(value);
        return reader.read().then(processText);
      });
    } else {
      // Use public URL for streaming
      const streamResponse = await fetch(fileUrl);
      if (!streamResponse.ok) {
        throw new Error(`Failed to fetch file: ${streamResponse.statusText}`);
      }
      // Handle the stream using getReader
      const reader = streamResponse.body.getReader();
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${path.basename(fileUrl)}"`
      );
      res.setHeader("Content-Type", "application/pdf");
      reader.read().then(function processText({ done, value }) {
        if (done) {
          res.end();
          return;
        }
        res.write(value);
        return reader.read().then(processText);
      });
    }
  } catch (error) {
    console.error("Download document error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const docId = req.params.docId;
    if (!isValidFirebaseId(docId)) {
      return res.status(400).json({ message: "Invalid document ID format" });
    }

    // RBAC check
    if (!req.user || !req.user.role) {
      return res
        .status(401)
        .json({ message: "User authentication data missing" });
    }
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied: Only admins can delete documents",
      });
    }

    const documentDoc = await db()
      .collection(collections.DOCUMENTS)
      .doc(docId)
      .get();

    if (!documentDoc.exists) {
      return res.status(404).json({ message: "Document not found" });
    }

    const document = { id: documentDoc.id, ...documentDoc.data() };

    // Extract public_id from fileUrl
    const publicId = document.fileUrl.match(
      /flesk_generated_documents\/[^\/]+/
    )[0];
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });

    await db().collection(collections.DOCUMENTS).doc(docId).delete();

    res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete document error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllDocuments = async (req, res) => {
  try {
    console.log("Querying all documents");
    
    const documentsSnapshot = await db()
      .collection(collections.DOCUMENTS)
      .get();

    console.log("Total documents found:", documentsSnapshot.size);

    if (documentsSnapshot.empty) {
      console.log("No documents in Firestore - returning empty array instead of 404");
      // Return empty array instead of 404 to allow the page to load
      return res.status(200).json([]);
    }

    const documents = [];
    for (const doc of documentsSnapshot.docs) {
      const data = doc.data();
      
      // Populate employee data
      const employeeDoc = await db()
        .collection(collections.EMPLOYEES)
        .doc(data.employeeId)
        .get();

      documents.push({
        id: doc.id,
        _id: doc.id, // For backward compatibility
        ...data,
        generatedDate: data.createdAt, // Alias for frontend compatibility
        employee: employeeDoc.exists
          ? {
              id: employeeDoc.id,
              name: employeeDoc.data().name,
            }
          : null,
      });
    }

    console.log("Returning", documents.length, "documents");
    res.status(200).json(documents);
  } catch (error) {
    console.error("Get all documents error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  generateAttestation,
  getDocuments,
  getAllAttestations,
  getAllDocuments,
  generatePaySlip,
  downloadDocument,
  deleteDocument,
};
