declare module 'react-simple-maps' {
  import React from 'react'

  export interface Geography {
    rsmKey: string
    properties: Record<string, unknown>
    geometry: unknown
  }

  export interface GeographiesChildrenArgs {
    geographies: Geography[]
    outline: Geography
    borders: Geography
  }

  export interface ComposableMapProps extends React.SVGProps<SVGSVGElement> {
    projection?: string
    projectionConfig?: {
      scale?: number
      rotation?: number[]
      center?: number[]
      parallels?: number[]
    }
    width?: number
    height?: number
    children?: React.ReactNode
  }

  export interface GeographiesProps {
    geography: string | Record<string, unknown>
    children: (args: GeographiesChildrenArgs) => React.ReactNode
    parseGeographies?: (geographies: unknown[]) => Geography[]
  }

  export interface GeographyProps extends React.SVGProps<SVGPathElement> {
    geography: Geography
    style?: {
      default?: React.CSSProperties
      hover?: React.CSSProperties
      pressed?: React.CSSProperties
    }
    onMouseEnter?: (event: React.MouseEvent<SVGPathElement>, geo: Geography) => void
    onMouseLeave?: (event: React.MouseEvent<SVGPathElement>, geo: Geography) => void
    onClick?: (event: React.MouseEvent<SVGPathElement>, geo: Geography) => void
  }

  export const ComposableMap: React.FC<ComposableMapProps>
  export const Geographies: React.FC<GeographiesProps>
  export const Geography: React.FC<GeographyProps>
  export const Marker: React.FC<Record<string, unknown>>
  export const Line: React.FC<Record<string, unknown>>
  export const Annotation: React.FC<Record<string, unknown>>
  export const Sphere: React.FC<Record<string, unknown>>
  export const Graticule: React.FC<Record<string, unknown>>
  export const ZoomableGroup: React.FC<Record<string, unknown>>
}
