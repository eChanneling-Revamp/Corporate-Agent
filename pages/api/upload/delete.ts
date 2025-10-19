import { NextApiRequest, NextApiResponse } from 'next'
import { apiResponse, handleApiError } from '../../../lib/validation'
import { requireAuth } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import fs from 'fs'
import path from 'path'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json(apiResponse.error('Method Not Allowed', 405))
  }

  try {
    const { filename } = req.query

    if (!filename || typeof filename !== 'string') {
      return res.status(400).json(apiResponse.error('Filename is required', 400))
    }

    // Check if file exists in filesystem
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename)
    const fileExists = fs.existsSync(filePath)

    if (!fileExists) {
      return res.status(404).json(apiResponse.error('File not found', 404))
    }

    // TODO: Add file ownership validation if needed
    // const fileRecord = await prisma.files.findFirst({
    //   where: { filename }
    // })

    // Delete file from filesystem
    fs.unlinkSync(filePath)

    // TODO: Delete file record from database if you have a files table
    // if (fileRecord) {
    //   await prisma.files.delete({
    //     where: { id: fileRecord.id }
    //   })
    // }

    res.status(200).json(apiResponse.success(null, 'File deleted successfully'))

  } catch (error) {
    return handleApiError(error, res)
  }
}

export default requireAuth(handler)