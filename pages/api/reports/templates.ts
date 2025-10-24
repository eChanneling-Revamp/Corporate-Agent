import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schemas
const createTemplateSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  reportType: z.enum(['APPOINTMENT_SUMMARY', 'REVENUE_ANALYSIS', 'AGENT_PERFORMANCE', 'CUSTOMER_SATISFACTION', 'OPERATIONAL_METRICS']),
  category: z.enum(['STANDARD', 'EXECUTIVE', 'DETAILED', 'SUMMARY', 'CUSTOM']).default('STANDARD'),
  layout: z.object({
    format: z.enum(['PDF', 'EXCEL', 'CSV', 'JSON']).default('PDF'),
    orientation: z.enum(['portrait', 'landscape']).default('portrait'),
    pageSize: z.enum(['A4', 'A3', 'LETTER', 'LEGAL']).default('A4'),
    margins: z.object({
      top: z.number().min(0).max(100).default(20),
      bottom: z.number().min(0).max(100).default(20),
      left: z.number().min(0).max(100).default(20),
      right: z.number().min(0).max(100).default(20)
    }).optional(),
    headerHeight: z.number().min(0).max(200).default(50),
    footerHeight: z.number().min(0).max(200).default(30),
    fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
    colorScheme: z.enum(['default', 'blue', 'green', 'red', 'purple', 'orange']).default('default')
  }),
  structure: z.object({
    sections: z.array(z.object({
      id: z.string(),
      type: z.enum(['header', 'summary', 'chart', 'table', 'text', 'image', 'spacer']),
      title: z.string().optional(),
      content: z.object({
        dataSource: z.string().optional(), // Field name from report data
        chartType: z.enum(['bar', 'line', 'pie', 'doughnut', 'area', 'scatter']).optional(),
        tableColumns: z.array(z.string()).optional(),
        textContent: z.string().optional(),
        imageUrl: z.string().optional(),
        height: z.number().optional(),
        showBorder: z.boolean().default(false),
        backgroundColor: z.string().optional()
      }),
      formatting: z.object({
        alignment: z.enum(['left', 'center', 'right']).default('left'),
        fontSize: z.enum(['small', 'medium', 'large']).optional(),
        fontWeight: z.enum(['normal', 'bold']).default('normal'),
        color: z.string().optional(),
        padding: z.number().min(0).max(50).default(10),
        margin: z.number().min(0).max(50).default(5)
      }).optional(),
      visibility: z.object({
        showTitle: z.boolean().default(true),
        conditional: z.object({
          field: z.string(),
          operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains']),
          value: z.union([z.string(), z.number(), z.boolean()])
        }).optional()
      }).optional()
    })),
    pageBreaks: z.array(z.string()).optional(), // Section IDs after which to insert page breaks
    showPageNumbers: z.boolean().default(true),
    showTimestamp: z.boolean().default(true)
  }),
  styling: z.object({
    headerTemplate: z.string().optional(), // HTML template for header
    footerTemplate: z.string().optional(), // HTML template for footer
    logoUrl: z.string().optional(),
    logoPosition: z.enum(['left', 'center', 'right']).default('left'),
    watermark: z.object({
      text: z.string(),
      opacity: z.number().min(0).max(1).default(0.1),
      rotation: z.number().min(-180).max(180).default(-45),
      fontSize: z.number().min(10).max(100).default(50)
    }).optional(),
    customCss: z.string().optional()
  }).optional(),
  permissions: z.object({
    isPublic: z.boolean().default(false),
    allowedRoles: z.array(z.enum(['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'AGENT', 'CUSTOMER_SERVICE'])).optional(),
    allowedUsers: z.array(z.string().cuid()).optional()
  }).default({ isPublic: false }),
  metadata: z.object({
    version: z.string().default('1.0'),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    lastModified: z.string().optional()
  }).optional(),
  createdBy: z.string().cuid()
})

const updateTemplateSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
  category: z.enum(['STANDARD', 'EXECUTIVE', 'DETAILED', 'SUMMARY', 'CUSTOM']).optional(),
  layout: z.object({
    format: z.enum(['PDF', 'EXCEL', 'CSV', 'JSON']).optional(),
    orientation: z.enum(['portrait', 'landscape']).optional(),
    pageSize: z.enum(['A4', 'A3', 'LETTER', 'LEGAL']).optional(),
    margins: z.object({
      top: z.number().min(0).max(100),
      bottom: z.number().min(0).max(100),
      left: z.number().min(0).max(100),
      right: z.number().min(0).max(100)
    }).optional(),
    headerHeight: z.number().min(0).max(200).optional(),
    footerHeight: z.number().min(0).max(200).optional(),
    fontSize: z.enum(['small', 'medium', 'large']).optional(),
    colorScheme: z.enum(['default', 'blue', 'green', 'red', 'purple', 'orange']).optional()
  }).optional(),
  structure: z.object({
    sections: z.array(z.any()).optional(), // Allow flexible section updates
    pageBreaks: z.array(z.string()).optional(),
    showPageNumbers: z.boolean().optional(),
    showTimestamp: z.boolean().optional()
  }).optional(),
  styling: z.object({
    headerTemplate: z.string().optional(),
    footerTemplate: z.string().optional(),
    logoUrl: z.string().optional(),
    logoPosition: z.enum(['left', 'center', 'right']).optional(),
    watermark: z.object({
      text: z.string(),
      opacity: z.number().min(0).max(1),
      rotation: z.number().min(-180).max(180),
      fontSize: z.number().min(10).max(100)
    }).optional(),
    customCss: z.string().optional()
  }).optional(),
  permissions: z.object({
    isPublic: z.boolean().optional(),
    allowedRoles: z.array(z.enum(['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'AGENT', 'CUSTOMER_SERVICE'])).optional(),
    allowedUsers: z.array(z.string().cuid()).optional()
  }).optional(),
  metadata: z.object({
    version: z.string().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional()
  }).optional()
})

const templateFiltersSchema = z.object({
  reportType: z.enum(['APPOINTMENT_SUMMARY', 'REVENUE_ANALYSIS', 'AGENT_PERFORMANCE', 'CUSTOMER_SATISFACTION', 'OPERATIONAL_METRICS']).optional(),
  category: z.enum(['STANDARD', 'EXECUTIVE', 'DETAILED', 'SUMMARY', 'CUSTOM']).optional(),
  createdBy: z.string().cuid().optional(),
  isPublic: z.string().transform(val => val === 'true').optional(),
  search: z.string().optional(),
  tags: z.string().optional(), // Comma-separated tags
  limit: z.string().transform(val => parseInt(val)).optional().default(50),
  offset: z.string().transform(val => parseInt(val)).optional().default(0)
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGet(req, res)
        break
      case 'POST':
        await handlePost(req, res)
        break
      case 'PUT':
        await handlePut(req, res)
        break
      case 'DELETE':
        await handleDelete(req, res)
        break
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
        res.status(405).json({ error: `Method ${req.method} not allowed` })
    }
  } catch (error) {
    console.error('Report templates API error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    await prisma.$disconnect()
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id, preview } = req.query
    
    if (id) {
      if (preview === 'true') {
        await getTemplatePreview(req, res, id as string)
      } else {
        await getTemplateDetails(req, res, id as string)
      }
    } else {
      await getTemplatesList(req, res)
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues
      })
    } else {
      throw error
    }
  }
}

async function getTemplateDetails(req: NextApiRequest, res: NextApiResponse, templateId: string) {
  // For this implementation, we'll store templates as activity logs with specific action
  // In production, you'd have a dedicated templates table
  const template = await prisma.activityLog.findFirst({
    where: {
      action: 'TEMPLATE_CREATED',
      entityType: 'ReportTemplate',
      entityId: templateId
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })

  if (!template) {
    return res.status(404).json({ error: 'Template not found' })
  }

  const templateData = template.details as any

  res.status(200).json({
    data: {
      id: templateId,
      name: templateData.name,
      description: templateData.description,
      reportType: templateData.reportType,
      category: templateData.category,
      layout: templateData.layout,
      structure: templateData.structure,
      styling: templateData.styling,
      permissions: templateData.permissions,
      metadata: {
        ...templateData.metadata,
        lastModified: template.createdAt
      },
      createdBy: template.user,
      createdAt: template.createdAt,
      updatedAt: template.createdAt,
      usageCount: templateData.usageCount || 0,
      lastUsed: templateData.lastUsed,
      isActive: templateData.isActive !== false,
      canEdit: true, // In production, check user permissions
      canDelete: true,
      canDuplicate: true
    }
  })
}

async function getTemplatePreview(req: NextApiRequest, res: NextApiResponse, templateId: string) {
  const template = await prisma.activityLog.findFirst({
    where: {
      action: 'TEMPLATE_CREATED',
      entityType: 'ReportTemplate',
      entityId: templateId
    }
  })

  if (!template) {
    return res.status(404).json({ error: 'Template not found' })
  }

  const templateData = template.details as any
  
  // Generate a preview representation of the template
  const preview = {
    id: templateId,
    name: templateData.name,
    layout: templateData.layout,
    sections: templateData.structure.sections.map((section: any) => ({
      id: section.id,
      type: section.type,
      title: section.title,
      preview: generateSectionPreview(section)
    })),
    previewUrl: `/api/reports/templates/${templateId}/render?sample=true`,
    thumbnailUrl: `/api/reports/templates/${templateId}/thumbnail`
  }

  res.status(200).json({
    data: preview
  })
}

async function getTemplatesList(req: NextApiRequest, res: NextApiResponse) {
  const validatedFilters = templateFiltersSchema.parse(req.query)
  
  const {
    reportType,
    category,
    createdBy,
    isPublic,
    search,
    tags,
    limit,
    offset
  } = validatedFilters

  const where: any = {
    action: 'TEMPLATE_CREATED',
    entityType: 'ReportTemplate'
  }
  
  if (createdBy) {
    where.userId = createdBy
  }

  const templates = await prisma.activityLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit + offset // Get more to allow for filtering
  })

  // Transform and filter templates
  let transformedTemplates = templates.map(template => {
    const templateData = template.details as any
    return {
      id: template.entityId,
      name: templateData.name,
      description: templateData.description,
      reportType: templateData.reportType,
      category: templateData.category,
      permissions: templateData.permissions,
      metadata: templateData.metadata,
      createdBy: template.user,
      createdAt: template.createdAt,
      updatedAt: template.createdAt,
      usageCount: templateData.usageCount || 0,
      lastUsed: templateData.lastUsed,
      isActive: templateData.isActive !== false,
      thumbnailUrl: `/api/reports/templates/${template.entityId}/thumbnail`,
      previewUrl: `/api/reports/templates/${template.entityId}/preview`,
      canEdit: true,
      canDelete: true,
      canDuplicate: true
    }
  })

  // Apply filters
  if (reportType) {
    transformedTemplates = transformedTemplates.filter(t => t.reportType === reportType)
  }
  if (category) {
    transformedTemplates = transformedTemplates.filter(t => t.category === category)
  }
  if (isPublic !== undefined) {
    transformedTemplates = transformedTemplates.filter(t => t.permissions?.isPublic === isPublic)
  }
  if (search) {
    const searchLower = search.toLowerCase()
    transformedTemplates = transformedTemplates.filter(t => 
      t.name.toLowerCase().includes(searchLower) ||
      (t.description || '').toLowerCase().includes(searchLower)
    )
  }
  if (tags) {
    const searchTags = tags.split(',').map(tag => tag.trim().toLowerCase())
    transformedTemplates = transformedTemplates.filter(t => 
      t.metadata?.tags?.some((tag: string) => 
        searchTags.includes(tag.toLowerCase())
      )
    )
  }

  // Apply pagination after filtering
  const totalCount = transformedTemplates.length
  const paginatedTemplates = transformedTemplates.slice(offset, offset + limit)

  res.status(200).json({
    data: paginatedTemplates,
    pagination: {
      total: totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount
    },
    summary: {
      totalTemplates: totalCount,
      byCategory: {
        STANDARD: transformedTemplates.filter(t => t.category === 'STANDARD').length,
        EXECUTIVE: transformedTemplates.filter(t => t.category === 'EXECUTIVE').length,
        DETAILED: transformedTemplates.filter(t => t.category === 'DETAILED').length,
        SUMMARY: transformedTemplates.filter(t => t.category === 'SUMMARY').length,
        CUSTOM: transformedTemplates.filter(t => t.category === 'CUSTOM').length
      },
      byReportType: {
        APPOINTMENT_SUMMARY: transformedTemplates.filter(t => t.reportType === 'APPOINTMENT_SUMMARY').length,
        REVENUE_ANALYSIS: transformedTemplates.filter(t => t.reportType === 'REVENUE_ANALYSIS').length,
        AGENT_PERFORMANCE: transformedTemplates.filter(t => t.reportType === 'AGENT_PERFORMANCE').length,
        CUSTOMER_SATISFACTION: transformedTemplates.filter(t => t.reportType === 'CUSTOMER_SATISFACTION').length,
        OPERATIONAL_METRICS: transformedTemplates.filter(t => t.reportType === 'OPERATIONAL_METRICS').length
      },
      publicTemplates: transformedTemplates.filter(t => t.permissions?.isPublic).length,
      activeTemplates: transformedTemplates.filter(t => t.isActive).length
    }
  })
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { duplicate } = req.query
    
    if (duplicate) {
      await handleDuplicateTemplate(req, res, duplicate as string)
    } else {
      await handleCreateTemplate(req, res)
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues
      })
    } else {
      throw error
    }
  }
}

async function handleCreateTemplate(req: NextApiRequest, res: NextApiResponse) {
  const validatedData = createTemplateSchema.parse(req.body)
  
  const {
    name,
    description,
    reportType,
    category,
    layout,
    structure,
    styling,
    permissions,
    metadata,
    createdBy
  } = validatedData

  // Verify creator exists
  const creator = await prisma.user.findUnique({
    where: { id: createdBy },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  })

  if (!creator) {
    return res.status(404).json({ error: 'Template creator not found' })
  }

  // Generate template ID
  const templateId = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Validate template structure
  const validationResult = validateTemplateStructure(structure, reportType)
  if (!validationResult.isValid) {
    return res.status(400).json({
      error: 'Invalid template structure',
      details: validationResult.errors
    })
  }

  // Create template record
  const templateRecord = await prisma.activityLog.create({
    data: {
      userId: createdBy,
      action: 'TEMPLATE_CREATED',
      entityType: 'ReportTemplate',
      entityId: templateId,
      details: {
        name,
        description,
        reportType,
        category,
        layout,
        structure,
        styling,
        permissions,
        metadata: {
          ...metadata,
          version: metadata?.version || '1.0',
          author: creator.name,
          lastModified: new Date().toISOString()
        },
        usageCount: 0,
        isActive: true,
        createdAt: new Date().toISOString()
      }
    }
  })

  // Create notification for template creation
  await prisma.notification.create({
    data: {
      userId: createdBy,
      title: 'Template Created',
      message: `Report template "${name}" has been created successfully.`,
      type: 'SYSTEM_ALERT',
      data: {
        templateId,
        templateName: name,
        category,
        reportType
      }
    }
  })

  res.status(201).json({
    message: 'Template created successfully',
    data: {
      id: templateId,
      name,
      description,
      reportType,
      category,
      layout,
      structure,
      styling,
      permissions,
      metadata: {
        ...metadata,
        version: metadata?.version || '1.0',
        author: creator.name,
        lastModified: new Date().toISOString()
      },
      createdBy: creator,
      createdAt: templateRecord.createdAt,
      usageCount: 0,
      isActive: true,
      canEdit: true,
      canDelete: true,
      canDuplicate: true
    }
  })
}

async function handleDuplicateTemplate(req: NextApiRequest, res: NextApiResponse, originalTemplateId: string) {
  const { name: newName, createdBy } = req.body

  if (!newName || !createdBy) {
    return res.status(400).json({ 
      error: 'Name and createdBy are required for template duplication' 
    })
  }

  // Get original template
  const originalTemplate = await prisma.activityLog.findFirst({
    where: {
      action: 'TEMPLATE_CREATED',
      entityType: 'ReportTemplate',
      entityId: originalTemplateId
    }
  })

  if (!originalTemplate) {
    return res.status(404).json({ error: 'Original template not found' })
  }

  const originalData = originalTemplate.details as any
  const templateId = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Create duplicate with new name
  const duplicateTemplate = await prisma.activityLog.create({
    data: {
      userId: createdBy,
      action: 'TEMPLATE_CREATED',
      entityType: 'ReportTemplate',
      entityId: templateId,
      details: {
        ...originalData,
        name: newName,
        metadata: {
          ...originalData.metadata,
          version: '1.0',
          originalTemplateId,
          lastModified: new Date().toISOString()
        },
        usageCount: 0,
        createdAt: new Date().toISOString()
      }
    }
  })

  res.status(201).json({
    message: 'Template duplicated successfully',
    data: {
      id: templateId,
      name: newName,
      originalTemplateId,
      createdAt: duplicateTemplate.createdAt
    }
  })
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query
    const validatedData = updateTemplateSchema.parse(req.body)

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid template ID' })
    }

    const existingTemplate = await prisma.activityLog.findFirst({
      where: {
        action: 'TEMPLATE_CREATED',
        entityType: 'ReportTemplate',
        entityId: id
      }
    })

    if (!existingTemplate) {
      return res.status(404).json({ error: 'Template not found' })
    }

    const currentData = existingTemplate.details as any
    const updatedData = {
      ...currentData,
      ...validatedData,
      metadata: {
        ...currentData.metadata,
        ...validatedData.metadata,
        lastModified: new Date().toISOString(),
        version: incrementVersion(currentData.metadata?.version || '1.0')
      }
    }

    // Validate updated structure if provided
    if (validatedData.structure) {
      const validationResult = validateTemplateStructure(
        { ...currentData.structure, ...validatedData.structure },
        currentData.reportType
      )
      if (!validationResult.isValid) {
        return res.status(400).json({
          error: 'Invalid template structure',
          details: validationResult.errors
        })
      }
    }

    const updatedTemplate = await prisma.activityLog.update({
      where: { id: existingTemplate.id },
      data: {
        details: updatedData
      }
    })

    res.status(200).json({
      message: 'Template updated successfully',
      data: {
        id,
        ...updatedData,
        updatedAt: new Date()
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.issues
      })
    } else {
      throw error
    }
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid template ID' })
    }

    const existingTemplate = await prisma.activityLog.findFirst({
      where: {
        action: 'TEMPLATE_CREATED',
        entityType: 'ReportTemplate',
        entityId: id
      }
    })

    if (!existingTemplate) {
      return res.status(404).json({ error: 'Template not found' })
    }

    // Soft delete by marking as inactive
    await prisma.activityLog.update({
      where: { id: existingTemplate.id },
      data: {
        details: {
          ...(existingTemplate.details as any),
          isActive: false,
          deletedAt: new Date().toISOString()
        }
      }
    })

    res.status(200).json({
      message: 'Template deleted successfully',
      data: {
        id,
        deletedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    throw error
  }
}

// Helper functions
function validateTemplateStructure(structure: any, reportType: string) {
  const errors = []

  // Validate sections
  if (!structure.sections || !Array.isArray(structure.sections)) {
    errors.push('Template must have at least one section')
    return { isValid: false, errors }
  }

  if (structure.sections.length === 0) {
    errors.push('Template must have at least one section')
  }

  // Validate section IDs are unique
  const sectionIds = structure.sections.map((s: any) => s.id)
  const uniqueIds = new Set(sectionIds)
  if (sectionIds.length !== uniqueIds.size) {
    errors.push('Section IDs must be unique')
  }

  // Validate section types are appropriate for report type
  const allowedSectionTypes = getSectionTypesForReportType(reportType)
  for (const section of structure.sections) {
    if (!allowedSectionTypes.includes(section.type)) {
      errors.push(`Section type "${section.type}" is not allowed for report type "${reportType}"`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

function getSectionTypesForReportType(reportType: string): string[] {
  const baseSections = ['header', 'summary', 'text', 'spacer']
  
  switch (reportType) {
    case 'APPOINTMENT_SUMMARY':
      return [...baseSections, 'table', 'chart']
    case 'REVENUE_ANALYSIS':
      return [...baseSections, 'chart', 'table']
    case 'AGENT_PERFORMANCE':
      return [...baseSections, 'chart', 'table']
    case 'CUSTOMER_SATISFACTION':
      return [...baseSections, 'chart', 'table']
    case 'OPERATIONAL_METRICS':
      return [...baseSections, 'chart', 'table']
    default:
      return [...baseSections, 'chart', 'table', 'image']
  }
}

function generateSectionPreview(section: any) {
  switch (section.type) {
    case 'header':
      return { type: 'header', title: section.title || 'Header Section' }
    case 'summary':
      return { type: 'summary', content: 'Summary statistics and key metrics' }
    case 'chart':
      return { 
        type: 'chart', 
        chartType: section.content?.chartType || 'bar',
        title: section.title || 'Chart'
      }
    case 'table':
      return { 
        type: 'table', 
        columns: section.content?.tableColumns || ['Column 1', 'Column 2'],
        title: section.title || 'Data Table'
      }
    case 'text':
      return { 
        type: 'text', 
        content: section.content?.textContent || 'Text content...'
      }
    default:
      return { type: section.type, title: section.title }
  }
}

function incrementVersion(currentVersion: string): string {
  const parts = currentVersion.split('.')
  const minor = parseInt(parts[1] || '0')
  return `${parts[0]}.${minor + 1}`
}
