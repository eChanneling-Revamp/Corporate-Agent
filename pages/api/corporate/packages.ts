import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

// Corporate Package Management API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return await getCorporatePackages(req, res)
    case 'POST':
      return await createCorporatePackage(req, res)
    case 'PUT':
      return await updateCorporatePackage(req, res)
    case 'DELETE':
      return await deleteCorporatePackage(req, res)
    default:
      return res.status(405).json({ 
        success: false, 
        message: 'Method not allowed' 
      })
  }
}

// Get all corporate packages with filtering
async function getCorporatePackages(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { 
      corporateId, 
      active, 
      packageType,
      search,
      page = 1,
      limit = 10 
    } = req.query

    const skip = (Number(page) - 1) * Number(limit)

    const where: any = {}
    
    if (corporateId) {
      where.corporateId = corporateId as string
    }
    
    if (active !== undefined) {
      where.isActive = active === 'true'
    }
    
    if (packageType) {
      where.packageType = packageType as string
    }
    
    if (search) {
      where.OR = [
        { packageName: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { corporateName: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    const [packages, total] = await Promise.all([
      prisma.corporatePackage.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          corporate: {
            select: {
              id: true,
              name: true,
              email: true,
              contactNumber: true
            }
          },
          packageBenefits: true,
          packageAppointments: {
            select: {
              id: true,
              appointmentId: true,
              usedAt: true,
              appointment: {
                select: {
                  appointmentNumber: true,
                  patientName: true,
                  appointmentDate: true,
                  status: true
                }
              }
            }
          }
        }
      }),
      prisma.corporatePackage.count({ where })
    ])

    return res.status(200).json({
      success: true,
      data: {
        packages,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    })

  } catch (error) {
    console.error('Get Corporate Packages Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}

// Create new corporate package
async function createCorporatePackage(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      corporateId,
      packageName,
      packageType,
      description,
      totalAppointments,
      usedAppointments = 0,
      packageValue,
      discountPercentage = 0,
      validFromDate,
      validToDate,
      benefits = [],
      restrictions = {},
      isActive = true,
      createdBy
    } = req.body

    // Validate required fields
    if (!corporateId || !packageName || !packageType || !totalAppointments || !packageValue) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: corporateId, packageName, packageType, totalAppointments, packageValue'
      })
    }

    // Check if corporate exists
    const corporate = await prisma.user.findUnique({
      where: { 
        id: corporateId,
        role: 'CORPORATE' // Assuming you have corporate role
      }
    })

    if (!corporate) {
      return res.status(404).json({
        success: false,
        message: 'Corporate client not found'
      })
    }

    // Generate package number
    const packageNumber = `PKG-${Date.now()}-${corporateId.substring(0, 8).toUpperCase()}`

    // Create package with benefits
    const newPackage = await prisma.corporatePackage.create({
      data: {
        corporateId,
        packageNumber,
        packageName,
        packageType,
        description,
        totalAppointments: Number(totalAppointments),
        usedAppointments: Number(usedAppointments),
        remainingAppointments: Number(totalAppointments) - Number(usedAppointments),
        packageValue: Number(packageValue),
        discountPercentage: Number(discountPercentage),
        validFromDate: new Date(validFromDate),
        validToDate: new Date(validToDate),
        restrictions,
        isActive,
        createdBy,
        packageBenefits: {
          createMany: {
            data: benefits.map((benefit: any) => ({
              benefitType: benefit.type,
              benefitDescription: benefit.description,
              benefitValue: benefit.value || 0,
              isActive: benefit.isActive !== false
            }))
          }
        }
      },
      include: {
        corporate: {
          select: {
            id: true,
            name: true,
            email: true,
            contactNumber: true
          }
        },
        packageBenefits: true
      }
    })

    // Log package creation
    await prisma.activityLog.create({
      data: {
        userId: createdBy,
        action: 'CORPORATE_PACKAGE_CREATED',
        entityType: 'CORPORATE_PACKAGE',
        entityId: newPackage.id,
        details: {
          packageNumber: newPackage.packageNumber,
          packageName: newPackage.packageName,
          corporateName: corporate.name,
          packageValue: newPackage.packageValue,
          totalAppointments: newPackage.totalAppointments
        },
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    })

    return res.status(201).json({
      success: true,
      data: {
        package: newPackage,
        message: 'Corporate package created successfully'
      }
    })

  } catch (error) {
    console.error('Create Corporate Package Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}

// Update corporate package
async function updateCorporatePackage(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { packageId, updatedBy, ...updateData } = req.body

    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: 'Package ID is required'
      })
    }

    // Check if package exists
    const existingPackage = await prisma.corporatePackage.findUnique({
      where: { id: packageId },
      include: { corporate: true }
    })

    if (!existingPackage) {
      return res.status(404).json({
        success: false,
        message: 'Corporate package not found'
      })
    }

    // Update package
    const updatedPackage = await prisma.corporatePackage.update({
      where: { id: packageId },
      data: {
        ...updateData,
        remainingAppointments: updateData.totalAppointments 
          ? Number(updateData.totalAppointments) - (updateData.usedAppointments || existingPackage.usedAppointments)
          : existingPackage.remainingAppointments,
        updatedAt: new Date()
      },
      include: {
        corporate: {
          select: {
            id: true,
            name: true,
            email: true,
            contactNumber: true
          }
        },
        packageBenefits: true
      }
    })

    // Log package update
    await prisma.activityLog.create({
      data: {
        userId: updatedBy,
        action: 'CORPORATE_PACKAGE_UPDATED',
        entityType: 'CORPORATE_PACKAGE',
        entityId: packageId,
        details: {
          packageNumber: updatedPackage.packageNumber,
          packageName: updatedPackage.packageName,
          corporateName: existingPackage.corporate?.name,
          changes: updateData
        },
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    })

    return res.status(200).json({
      success: true,
      data: {
        package: updatedPackage,
        message: 'Corporate package updated successfully'
      }
    })

  } catch (error) {
    console.error('Update Corporate Package Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}

// Delete/Deactivate corporate package
async function deleteCorporatePackage(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { packageId, deletedBy, permanent = false } = req.body

    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: 'Package ID is required'
      })
    }

    const existingPackage = await prisma.corporatePackage.findUnique({
      where: { id: packageId },
      include: { corporate: true }
    })

    if (!existingPackage) {
      return res.status(404).json({
        success: false,
        message: 'Corporate package not found'
      })
    }

    let result
    if (permanent) {
      // Permanent deletion
      result = await prisma.corporatePackage.delete({
        where: { id: packageId }
      })
    } else {
      // Soft delete (deactivate)
      result = await prisma.corporatePackage.update({
        where: { id: packageId },
        data: {
          isActive: false,
          deactivatedAt: new Date(),
          deactivatedBy: deletedBy
        }
      })
    }

    // Log package deletion
    await prisma.activityLog.create({
      data: {
        userId: deletedBy,
        action: permanent ? 'CORPORATE_PACKAGE_DELETED' : 'CORPORATE_PACKAGE_DEACTIVATED',
        entityType: 'CORPORATE_PACKAGE',
        entityId: packageId,
        details: {
          packageNumber: existingPackage.packageNumber,
          packageName: existingPackage.packageName,
          corporateName: existingPackage.corporate?.name,
          permanent
        },
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    })

    return res.status(200).json({
      success: true,
      data: {
        message: `Corporate package ${permanent ? 'deleted' : 'deactivated'} successfully`
      }
    })

  } catch (error) {
    console.error('Delete Corporate Package Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}
