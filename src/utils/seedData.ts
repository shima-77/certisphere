import { 
  CertificateTemplate, 
  InstitutionalEvent, 
  CertificateRecord, 
  AuditLogEntry, 
  InstitutionProfile,
  EmailDispatchRecord,
  ParticipantRecord 
} from '../types';

export const INITIAL_INSTITUTION: InstitutionProfile = {
  name: "Vignan's Foundation for Science, Technology & Research (Deemed to be University)",
  code: "VFSTR",
  motto: "A Place for Value-Added Education & Global Research Excellence",
  accreditation: "NAAC A+ Accredited · UGC Category-1 Deemed to be University · NBA Approved",
  authorizedAdmin: "Dr. K.V. Krishna Kishore, Dean of Academic Affairs",
  adminEmail: "dean_academics@vignan.ac.in",
  verificationBaseUrl: window.location.origin,
  logoShield: "apex"
};

// Specialized Vignan University Department Themes
export const INITIAL_TEMPLATES: CertificateTemplate[] = [
  {
    id: "tpl-cse",
    name: "CSE · Computer Science & Engineering",
    departmentTheme: "CSE",
    departmentName: "Department of Computer Science & Engineering",
    style: "academic-classic",
    primaryColor: "#0f2b48", // Royal Academic Navy
    accentColor: "#b48c36", // Gold
    fontFamily: "cinzel",
    orientation: "landscape",
    institutionName: "Vignan's Foundation for Science, Technology & Research",
    institutionSubtitle: "School of Computing & Informatics · Department of CSE · Vadlamudi",
    sealType: "academic-shield",
    headerTitle: "Certificate of Academic & Technical Excellence",
    headerSubtitle: "Conferred with highest university honors unto",
    defaultCitationTemplate: "In recognition of outstanding competence in software engineering, algorithmic design, and exemplary contribution to computing symposium events.",
    signatories: [
      {
        id: "sig-cse-1",
        name: "Dr. D. Venkatesulu",
        title: "Dean, School of Computing",
        department: "Department of CSE",
        signatureSvgType: "dean"
      },
      {
        id: "sig-cse-2",
        name: "Prof. P. Nagabhushan",
        title: "Vice-Chancellor",
        department: "Vignan University",
        signatureSvgType: "director"
      }
    ],
    showQrCode: true,
    showCryptographicHash: true,
    showWatermark: true
  },
  {
    id: "tpl-aiml",
    name: "AIML · Artificial Intelligence & Machine Learning",
    departmentTheme: "AIML",
    departmentName: "Department of Artificial Intelligence & Machine Learning",
    style: "cyber-neural",
    primaryColor: "#090d16", // Neural Void Black
    accentColor: "#8b5cf6", // Electric Violet / Purple
    fontFamily: "sans",
    orientation: "landscape",
    institutionName: "Vignan University · Department of AI & Machine Learning",
    institutionSubtitle: "Center for Excellence in Deep Learning & Generative AI · Vadlamudi",
    sealType: "neural-ai",
    headerTitle: "Certificate of Machine Intelligence & Innovation",
    headerSubtitle: "Awarded to the distinguished researcher / practitioner",
    defaultCitationTemplate: "For exemplary innovation in transformer architectures, deep neural optimization, and securing distinguished honors in the Machine Intelligence Summit.",
    signatories: [
      {
        id: "sig-aiml-1",
        name: "Dr. K.V. Krishna Kishore",
        title: "Dean, Academic Affairs & AI Lead",
        department: "Department of AIML",
        signatureSvgType: "dean"
      },
      {
        id: "sig-aiml-2",
        name: "Dr. M.S. Raghunathan",
        title: "Registrar",
        department: "Vignan University",
        signatureSvgType: "chancellor"
      }
    ],
    showQrCode: true,
    showCryptographicHash: true,
    showWatermark: false
  },
  {
    id: "tpl-robotics",
    name: "Robotics & Automation / Mechatronics",
    departmentTheme: "ROBOTICS",
    departmentName: "Division of Robotics & Autonomous Systems",
    style: "robotics-industrial",
    primaryColor: "#0f172a", // Carbon Slate
    accentColor: "#f59e0b", // Industrial Amber/Orange
    fontFamily: "sans",
    orientation: "landscape",
    institutionName: "Vignan University · Division of Robotics & Automation",
    institutionSubtitle: "Vignan Innovation and Incubation Centre (VIIC) · Robotics Arena",
    sealType: "robotics-gear",
    headerTitle: "Certificate of Autonomous Engineering Excellence",
    headerSubtitle: "Conferred upon the technical participant for outstanding robotic execution",
    defaultCitationTemplate: "In recognition of superior hardware-software co-design, real-time kinematics, and meritorious achievement in the National Autonomous Robotics Conclave.",
    signatories: [
      {
        id: "sig-rob-1",
        name: "Dr. K. Venkata Rao",
        title: "Director, Vignan Innovation Centre",
        department: "Robotics & Automation",
        signatureSvgType: "curator"
      },
      {
        id: "sig-rob-2",
        name: "Dr. D. Venkatesulu",
        title: "Dean, School of Computing",
        department: "Vignan University",
        signatureSvgType: "director"
      }
    ],
    showQrCode: true,
    showCryptographicHash: true,
    showWatermark: true
  },
  {
    id: "tpl-it",
    name: "IT · Information Technology & Cloud Systems",
    departmentTheme: "IT",
    departmentName: "Department of Information Technology",
    style: "modern-tech",
    primaryColor: "#032840", // Deep Ocean Cyan
    accentColor: "#0284c7", // Sky Blue
    fontFamily: "sans",
    orientation: "landscape",
    institutionName: "Vignan University · Department of Information Technology",
    institutionSubtitle: "Cloud Computing & Distributed Systems Laboratory · Vadlamudi",
    sealType: "tech-emblem",
    headerTitle: "Certificate of Cloud Architecture & DevOps",
    headerSubtitle: "Presented to the designated candidate in recognition of technical acumen",
    defaultCitationTemplate: "Having satisfactorily completed advanced practicum in microservices architecture, Docker clustering, and zero-trust cloud network deployment.",
    signatories: [
      {
        id: "sig-it-1",
        name: "Dr. B. Premamayudu",
        title: "Head, Department of IT",
        department: "School of Computing",
        signatureSvgType: "curator"
      },
      {
        id: "sig-it-2",
        name: "Dr. K.V. Krishna Kishore",
        title: "Dean, Academic Affairs",
        department: "Vignan University",
        signatureSvgType: "dean"
      }
    ],
    showQrCode: true,
    showCryptographicHash: true,
    showWatermark: false
  },
  {
    id: "tpl-ece",
    name: "ECE · Electronics & Communication Engineering",
    departmentTheme: "ECE",
    departmentName: "Department of Electronics & Communication Engineering",
    style: "stem-excellence",
    primaryColor: "#064e3b", // Deep Emerald
    accentColor: "#10b981", // Circuit Green
    fontFamily: "sans",
    orientation: "landscape",
    institutionName: "Vignan University · Department of ECE",
    institutionSubtitle: "VLSI, IoT & Embedded Signal Processing Centre · Vadlamudi",
    sealType: "tech-emblem",
    headerTitle: "Certificate of Merit in Embedded Systems & VLSI",
    headerSubtitle: "Official verification that the candidate has demonstrated distinction",
    defaultCitationTemplate: "For exemplary technical design in digital signal processing, FPGA synthesis, and active participation in the National ECE Technical Symposium.",
    signatories: [
      {
        id: "sig-ece-1",
        name: "Dr. T. Pitchaiah",
        title: "Head, Department of ECE",
        department: "School of Electrical Sciences",
        signatureSvgType: "curator"
      },
      {
        id: "sig-ece-2",
        name: "Prof. P. Nagabhushan",
        title: "Vice-Chancellor",
        department: "Vignan University",
        signatureSvgType: "director"
      }
    ],
    showQrCode: true,
    showCryptographicHash: true,
    showWatermark: true
  },
  {
    id: "tpl-biotech",
    name: "Biotech · Biotechnology & Bioinformatics",
    departmentTheme: "BIOTECH",
    departmentName: "Department of Biotechnology",
    style: "academic-classic",
    primaryColor: "#134e4a", // Deep Teal
    accentColor: "#14b8a6", // Bright Teal
    fontFamily: "garamond",
    orientation: "landscape",
    institutionName: "Vignan's Foundation for Science, Technology & Research",
    institutionSubtitle: "Department of Biotechnology & Food Technology · Vadlamudi",
    sealType: "bio-helix",
    headerTitle: "Certificate of Biomedical & Genomic Research",
    headerSubtitle: "Conferred in recognition of meritorious scientific investigation",
    defaultCitationTemplate: "In acknowledgement of distinguished research methodology, computational biology analysis, and presentation at the National Bio-Tech Colloquium.",
    signatories: [
      {
        id: "sig-bio-1",
        name: "Dr. S. Krupanidhi",
        title: "Head, Department of Biotechnology",
        department: "School of Bio-Sciences",
        signatureSvgType: "dean"
      },
      {
        id: "sig-bio-2",
        name: "Prof. P. Nagabhushan",
        title: "Vice-Chancellor",
        department: "Vignan University",
        signatureSvgType: "director"
      }
    ],
    showQrCode: true,
    showCryptographicHash: true,
    showWatermark: true
  },
  {
    id: "tpl-mechanical",
    name: "Mechanical Engineering & Manufacturing",
    departmentTheme: "MECHANICAL",
    departmentName: "Department of Mechanical Engineering",
    style: "stem-excellence",
    primaryColor: "#1c1917", // Warm Stone Black
    accentColor: "#ea580c", // Industrial Blaze
    fontFamily: "sans",
    orientation: "landscape",
    institutionName: "Vignan University · Department of Mechanical Engineering",
    institutionSubtitle: "Center for Advanced Manufacturing, CAD/CAM & Automobile Dynamics",
    sealType: "robotics-gear",
    headerTitle: "Certificate of Engineering & Design Excellence",
    headerSubtitle: "Conferred upon the candidate for superior mechanical fabrication",
    defaultCitationTemplate: "For exemplary design modeling, kinematic analysis, and successful fabrication in the National Mechanical Design Competition.",
    signatories: [
      {
        id: "sig-mech-1",
        name: "Dr. L. Suvarna Raju",
        title: "Head, Department of Mechanical Engg",
        department: "School of Engineering",
        signatureSvgType: "curator"
      },
      {
        id: "sig-mech-2",
        name: "Dr. K.V. Krishna Kishore",
        title: "Dean of Academic Affairs",
        department: "Vignan University",
        signatureSvgType: "director"
      }
    ],
    showQrCode: true,
    showCryptographicHash: true,
    showWatermark: false
  },
  {
    id: "tpl-management",
    name: "Management Studies · SMS (MBA/BBA)",
    departmentTheme: "MANAGEMENT",
    departmentName: "School of Management Studies",
    style: "gold-prestige",
    primaryColor: "#4a044e", // Deep Imperial Plum/Burgundy
    accentColor: "#d97706", // Gold
    fontFamily: "garamond",
    orientation: "landscape",
    institutionName: "Vignan's Foundation for Science, Technology & Research",
    institutionSubtitle: "School of Management Studies (SMS) · Vadlamudi",
    sealType: "laurel-wreath",
    headerTitle: "Certificate of Executive Leadership & Case Merit",
    headerSubtitle: "Presented with distinction unto the business scholar",
    defaultCitationTemplate: "In recognition of superior strategic analysis, financial modeling, and winning 1st Place in the National Business Case Conclave.",
    signatories: [
      {
        id: "sig-mgmt-1",
        name: "Dr. K. Kalpana",
        title: "Dean, School of Management Studies",
        department: "Vignan University",
        signatureSvgType: "dean"
      },
      {
        id: "sig-mgmt-2",
        name: "Prof. P. Nagabhushan",
        title: "Vice-Chancellor",
        department: "Vignan University",
        signatureSvgType: "director"
      }
    ],
    showQrCode: true,
    showCryptographicHash: true,
    showWatermark: true
  }
];

// Clean Slate: Empty Initial Records as requested by user!
export const INITIAL_EVENTS: InstitutionalEvent[] = [];
export const INITIAL_CERTIFICATES: CertificateRecord[] = [];
export const INITIAL_PARTICIPANTS: ParticipantRecord[] = [];
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];
export const INITIAL_DISPATCH_QUEUE: EmailDispatchRecord[] = [];

// Optional preset loader helper in case user wants sample demo data loaded with 1 click
export const SAMPLE_VIGNAN_PRESETS = {
  events: [
    {
      id: "evt-mahotsav-2026",
      title: "Vignan Mahotsav 2026 - National Technical Symposium & Hackathon",
      code: "VFSTR-MAHOTSAV-26",
      category: "Hackathon & Competition" as const,
      department: "Department of Computer Science & Engineering",
      venue: "Vignan Innovation and Incubation Centre (VIIC) & U-Block Auditorium",
      startDate: "2026-10-14",
      endDate: "2026-10-16",
      status: "Ongoing" as const,
      coordinator: "Dr. D. Venkatesulu",
      coCoordinator: "Dr. K. Venkata Rao",
      description: "Annual 36-hour flagship national technical hackathon with tracks in Autonomous AI, Robotics, and Cloud Native Architectures.",
      templateId: "tpl-cse",
      totalParticipants: 3,
      certificatesIssued: 2,
      fraudFlagsCount: 0
    }
  ],
  participants: [
    {
      id: "part-001",
      eventId: "evt-mahotsav-2026",
      name: "Sai Vardhan Reddy",
      email: "saivardhan.22@vignan.ac.in",
      rollNo: "221FA04128",
      institution: "Vignan's Foundation for Science, Technology & Research (VFSTR)",
      role: "Winner - 1st Place" as const,
      rank: "1st Place (Grand Prize)",
      projectTitle: "Autonomous Edge Drone AI",
      attendanceScore: 100,
      certificateId: "CERT-2026-VFSTR-9F83A2",
      issueStatus: "ISSUED" as const,
      dispatchStatus: "DOWNLOADED" as const
    },
    {
      id: "part-002",
      eventId: "evt-mahotsav-2026",
      name: "Bhavana Chowdary",
      email: "bhavana.22@vignan.ac.in",
      rollNo: "221FA04045",
      institution: "Vignan's Foundation for Science, Technology & Research (VFSTR)",
      role: "Runner Up - 2nd Place" as const,
      rank: "2nd Place",
      projectTitle: "Tensor Core Neural Vision",
      attendanceScore: 98,
      certificateId: "CERT-2026-VFSTR-77D1C4",
      issueStatus: "ISSUED" as const,
      dispatchStatus: "DELIVERED" as const
    },
    {
      id: "part-003",
      eventId: "evt-mahotsav-2026",
      name: "Tarun Kumar",
      email: "tarun.22@vignan.ac.in",
      rollNo: "221FA04190",
      institution: "Vignan's Foundation for Science, Technology & Research (VFSTR)",
      role: "Participant" as const,
      attendanceScore: 92,
      issueStatus: "PENDING" as const,
      dispatchStatus: "UNSENT" as const
    }
  ],
  certificates: [
    {
      id: "CERT-2026-VFSTR-9F83A2",
      certificateNumber: "VFSTR/CSE/2026/0142",
      eventId: "evt-mahotsav-2026",
      eventTitle: "Vignan Mahotsav 2026 - National Technical Symposium & Hackathon",
      eventCategory: "Hackathon & Competition",
      participantId: "part-001",
      recipientName: "Sai Vardhan Reddy",
      recipientEmail: "saivardhan.22@vignan.ac.in",
      recipientRollNo: "221FA04128",
      recipientInstitution: "Vignan's Foundation for Science, Technology & Research (VFSTR)",
      role: "Winner - 1st Place" as const,
      rank: "1st Place (Grand Prize)",
      projectTitle: "Autonomous Edge Drone AI",
      citation: "In recognition of outstanding engineering prowess, securing 1st Place in the Vignan Mahotsav Hackathon.",
      issueDate: "2026-10-16",
      status: "VALID" as const,
      templateId: "tpl-cse",
      cryptographicHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      issuerAuthority: "VFSTR Academic Assessment Board · School of Computing",
      publicVerificationUrl: `${window.location.origin}/?verify=CERT-2026-VFSTR-9F83A2`,
      qrPayload: `${window.location.origin}/?verify=CERT-2026-VFSTR-9F83A2`,
      downloadsCount: 1,
      verificationsCount: 3
    }
  ]
};
