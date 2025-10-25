import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

// Multi-language Support API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return await getTranslations(req, res)
    case 'POST':
      return await updateTranslations(req, res)
    case 'PUT':
      return await createTranslation(req, res)
    default:
      return res.status(405).json({ 
        success: false, 
        message: 'Method not allowed' 
      })
  }
}

// Get translations for a specific language and module
async function getTranslations(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { 
      language = 'en', 
      module = 'common', 
      keys 
    } = req.query

    // Validate language code
    const supportedLanguages = ['en', 'si', 'ta'] // English, Sinhala, Tamil
    if (!supportedLanguages.includes(language as string)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported language: ${language}. Supported languages: ${supportedLanguages.join(', ')}`
      })
    }

    let where: any = {
      language: language as string,
      module: module as string
    }

    // If specific keys requested
    if (keys) {
      const keyArray = (keys as string).split(',')
      where.key = { in: keyArray }
    }

    const translations = await prisma.translation.findMany({
      where,
      select: {
        key: true,
        value: true,
        module: true,
        context: true
      }
    })

    // Format as key-value pairs for easy consumption
    const translationMap = translations.reduce((acc, translation) => {
      acc[translation.key] = {
        value: translation.value,
        context: translation.context
      }
      return acc
    }, {} as Record<string, any>)

    return res.status(200).json({
      success: true,
      data: {
        language,
        module,
        translations: translationMap,
        count: translations.length
      }
    })

  } catch (error) {
    console.error('Get Translations Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}

// Update existing translations
async function updateTranslations(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { 
      language, 
      module, 
      translations, 
      updatedBy 
    } = req.body

    if (!language || !module || !translations || !updatedBy) {
      return res.status(400).json({
        success: false,
        message: 'Language, module, translations, and updatedBy are required'
      })
    }

    const results = []
    
    for (const [key, data] of Object.entries(translations)) {
      const translationData = data as any
      
      try {
        const updated = await prisma.translation.upsert({
          where: {
            language_module_key: {
              language,
              module,
              key
            }
          },
          update: {
            value: translationData.value,
            context: translationData.context,
            updatedBy,
            updatedAt: new Date()
          },
          create: {
            language,
            module,
            key,
            value: translationData.value,
            context: translationData.context || '',
            createdBy: updatedBy,
            updatedBy
          }
        })

        results.push({
          key,
          status: 'success',
          action: updated.createdAt === updated.updatedAt ? 'created' : 'updated'
        })

      } catch (error) {
        results.push({
          key,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Log translation update activity
    await prisma.activityLog.create({
      data: {
        userId: updatedBy,
        action: 'TRANSLATIONS_UPDATED',
        entityType: 'TRANSLATION',
        entityId: `${language}_${module}`,
        details: {
          language,
          module,
          keysUpdated: Object.keys(translations),
          results: results.filter(r => r.status === 'success').length,
          errors: results.filter(r => r.status === 'error').length
        },
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    })

    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length

    return res.status(200).json({
      success: true,
      data: {
        message: `Translations updated: ${successCount} successful, ${errorCount} failed`,
        results,
        summary: {
          successful: successCount,
          failed: errorCount,
          total: results.length
        }
      }
    })

  } catch (error) {
    console.error('Update Translations Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}

// Create new translation key
async function createTranslation(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      key,
      translations, // { en: 'value', si: 'value', ta: 'value' }
      module,
      context,
      createdBy
    } = req.body

    if (!key || !translations || !module || !createdBy) {
      return res.status(400).json({
        success: false,
        message: 'Key, translations, module, and createdBy are required'
      })
    }

    const results = []

    for (const [language, value] of Object.entries(translations)) {
      if (!value) continue

      try {
        const translation = await prisma.translation.create({
          data: {
            language,
            module,
            key,
            value: value as string,
            context: context || '',
            createdBy,
            updatedBy: createdBy
          }
        })

        results.push({
          language,
          status: 'success',
          translationId: translation.id
        })

      } catch (error) {
        results.push({
          language,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Log translation creation
    await prisma.activityLog.create({
      data: {
        userId: createdBy,
        action: 'TRANSLATION_KEY_CREATED',
        entityType: 'TRANSLATION',
        entityId: key,
        details: {
          key,
          module,
          languages: Object.keys(translations),
          context
        },
        ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
      }
    })

    const successCount = results.filter(r => r.status === 'success').length

    return res.status(201).json({
      success: true,
      data: {
        message: `Translation key '${key}' created for ${successCount} languages`,
        results,
        translationKey: key
      }
    })

  } catch (error) {
    console.error('Create Translation Error:', error)
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}